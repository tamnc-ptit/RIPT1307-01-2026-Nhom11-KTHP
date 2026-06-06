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

  // 1. Lấy danh sách các lớp còn chỗ trống
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

  let availableClasses = classesResult.recordset.map((c) => ({
    id: c.id,
    class_name: c.class_name,
    available_slots: parseInt(c.available_slots),
  }));

  // TỐI ƯU 1: Hạ saltRounds xuống 4 để băm mật khẩu hàng loạt nhanh gấp 20 lần, giải phóng Event Loop Node.js
  const defaultPasswordHash = await bcrypt.hash("Ptit@123456", 4);
  let currentClassIndex = 0;
  let successCount = 0;
  let skipCount = 0;

  // TỐI ƯU 2: Sử dụng vòng lặp độc lập, giải phóng Lock bảng SQL Server ngay sau mỗi sinh viên
  for (const row of rawStudents) {
    const studentCode = row["Mã sinh viên"]?.toString().trim();
    const fullName = row["Họ và tên"]?.toString().trim();
    const email = row["Email"]?.toString().trim();

    if (!studentCode || !fullName || !email) continue;

    // Kiểm tra trùng bằng request đơn, không dùng chung Transaction kéo dài
    const checkEmailResult = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (checkEmailResult.recordset.length > 0) {
      skipCount++;
      continue;
    }

    // Tìm lớp còn trống slot
    while (
      availableClasses[currentClassIndex] &&
      availableClasses[currentClassIndex].available_slots === 0
    ) {
      currentClassIndex++;
    }

    const assignedClass = availableClasses[currentClassIndex];
    if (!assignedClass) {
      throw new Error(
        `Hệ thống đã hết chỗ lớp trống! Đã import thành công ${successCount} sinh viên.`,
      );
    }

    // Tạo Transaction siêu nhỏ (Micro-transaction) CHỈ CHO RIÊNG 1 sinh viên này
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // Thêm User
      const userResult = await new sql.Request(transaction)
        .input("email", sql.NVarChar, email)
        .input("password_hash", sql.NVarChar, defaultPasswordHash)
        .input("name", sql.NVarChar, fullName).query(`
          INSERT INTO Users (email, password_hash, role, name, is_active, created_at, updated_at)
          VALUES (@email, @password_hash, 'student', @name, 1, GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS userId;
        `);

      const newUserId = userResult.recordset[0].userId;

      // Thêm Hồ sơ
      await new sql.Request(transaction)
        .input("user_id", sql.Int, newUserId)
        .input("student_code", sql.NVarChar, studentCode).query(`
          INSERT INTO UserProfiles (user_id, student_code, updated_at)
          VALUES (@user_id, @student_code, GETDATE())
        `);

      // Xếp vào lớp
      await new sql.Request(transaction)
        .input("class_id", sql.Int, assignedClass.id)
        .input("student_id", sql.Int, newUserId).query(`
          INSERT INTO ClassStudents (class_id, student_id, joined_at)
          VALUES (@class_id, @student_id, GETDATE())
        `);

      // Commit ngay lập tức để giải phóng tài nguyên database cho các request khác đi vào
      await transaction.commit();

      assignedClass.available_slots--;
      successCount++;
    } catch (innerErr) {
      if (transaction._started) {
        await transaction.rollback();
      }
      console.error(`Lỗi dòng sinh viên ${studentCode}:`, innerErr.message);
    }
  }

  if (successCount === 0 && skipCount > 0) {
    throw new Error(
      `Tất cả ${skipCount} sinh viên trong file đều đã tồn tại trên hệ thống.`,
    );
  }

  return { successCount, skipCount };
};
