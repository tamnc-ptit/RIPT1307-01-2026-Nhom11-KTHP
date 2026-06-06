const { poolPromise, sql } = require("../config/db");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt"); 
exports.importAndAutoAssignClasses = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawStudents = xlsx.utils.sheet_to_json(sheet);

  if (rawStudents.length === 0) {
    throw new Error("File Excel không có dữ liệu sinh viên!");
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    const classesResult = await pool.request().query(`
      SELECT 
        c.id, 
        c.class_name, 
        c.max_students,
        COUNT(cs.student_id) AS current_students,
        (c.max_students - COUNT(cs.student_id)) AS available_slots
      FROM Classes c
      LEFT JOIN ClassStudents cs ON c.id = cs.class_id
      GROUP BY c.id, c.class_name, c.max_students
      HAVING (c.max_students - COUNT(cs.student_id)) > 0
      ORDER BY c.id ASC;
    `);

    let availableClasses = classesResult.recordset.map(c => ({
      id: c.id,
      class_name: c.class_name,
      available_slots: parseInt(c.available_slots)
    }));

    const totalAvailableSlots = availableClasses.reduce((sum, c) => sum + c.available_slots, 0);
    if (totalAvailableSlots < rawStudents.length) {
      throw new Error(`Hệ thống không đủ chỗ! Tổng chỗ trống hiện tại là ${totalAvailableSlots}, nhưng số sinh viên import là ${rawStudents.length}`);
    }

    await transaction.begin();
    
    const defaultPasswordHash = await bcrypt.hash("Ptit@123456", 10); 
    let currentClassIndex = 0; 
    let successCount = 0;

    for (const row of rawStudents) {
      const studentCode = row["Mã sinh viên"]?.toString().trim();
      const fullName = row["Họ và tên"]?.toString().trim();
      const email = row["Email"]?.toString().trim();

      if (!studentCode || !fullName || !email) continue;

      const userRequest = new sql.Request(transaction);
      const userResult = await userRequest
        .input("email", sql.NVarChar, email)
        .input("password_hash", sql.NVarChar, defaultPasswordHash)
        .input("name", sql.NVarChar, fullName).query(`
          INSERT INTO Users (email, password_hash, role, name, is_active, created_at, updated_at)
          VALUES (@email, @password_hash, 'student', @name, 1, GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS userId;
        `);

      const newUserId = userResult.recordset[0].userId;

      const profileRequest = new sql.Request(transaction);
      await profileRequest
        .input("user_id", sql.Int, newUserId)
        .input("student_code", sql.NVarChar, studentCode).query(`
          INSERT INTO UserProfiles (user_id, student_code, updated_at)
          VALUES (@user_id, @student_code, GETDATE())
        `);

      while (
        availableClasses[currentClassIndex] &&
        availableClasses[currentClassIndex].available_slots === 0
      ) {
        currentClassIndex++;
      }

      const assignedClass = availableClasses[currentClassIndex];
      if (!assignedClass) {
        throw new Error(
          "Lỗi phát sinh ngoài dự kiến: Đã hết lớp trống trong quá trình vòng lặp.",
        );
      }
      const classStudentRequest = new sql.Request(transaction);
      await classStudentRequest
        .input("class_id", sql.Int, assignedClass.id)
        .input("student_id", sql.Int, newUserId).query(`
          INSERT INTO ClassStudents (class_id, student_id, joined_at)
          VALUES (@class_id, @student_id, GETDATE())
        `);
      assignedClass.available_slots--;
      successCount++;
    }

    await transaction.commit();
    return { successCount };

  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};