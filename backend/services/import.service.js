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

    await transaction.begin();

    const defaultPasswordHash = await bcrypt.hash("Ptit@123456", 10);
    let currentClassIndex = 0;
    let successCount = 0;
    let skipCount = 0; // Đếm số lượng sinh viên bị trùng được bỏ qua

    for (const row of rawStudents) {
      // Đọc đúng tiêu đề cột từ file Excel của bạn
      const studentCode = row["Mã sinh viên"]?.toString().trim();
      const fullName = row["Họ và tên"]?.toString().trim();
      const email = row["Email"]?.toString().trim();

      if (!studentCode || !fullName || !email) continue;

      // --- BƯỚC THAY ĐỔI: KIỂM TRA TRÙNG EMAIL TRƯỚC KHI INSERT ---
      const checkEmailRequest = new sql.Request(transaction);
      const checkEmailResult = await checkEmailRequest
        .input("email", sql.NVarChar, email)
        .query("SELECT id FROM Users WHERE email = @email");

      if (checkEmailResult.recordset.length > 0) {
        // Email đã tồn tại trong hệ thống -> Bỏ qua dòng này, chuyển sang dòng tiếp theo
        skipCount++;
        continue;
      }
      // -----------------------------------------------------------

      // Kiểm tra xem hệ thống còn lớp nào trống không trước khi xếp lớp cho sinh viên hợp lệ này
      while (
        availableClasses[currentClassIndex] &&
        availableClasses[currentClassIndex].available_slots === 0
      ) {
        currentClassIndex++;
      }

      const assignedClass = availableClasses[currentClassIndex];
      if (!assignedClass) {
        throw new Error(
          `Hệ thống đã hết chỗ lớp trống! Đã import thành công ${successCount} sinh viên, dừng lại ở sinh viên mang mã: ${studentCode}`,
        );
      }

      // Tiến hành tạo tài khoản người dùng mới
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

      // Tạo thông tin hồ sơ chi tiết (Mã sinh viên)
      const profileRequest = new sql.Request(transaction);
      await profileRequest
        .input("user_id", sql.Int, newUserId)
        .input("student_code", sql.NVarChar, studentCode).query(`
          INSERT INTO UserProfiles (user_id, student_code, updated_at)
          VALUES (@user_id, @student_code, GETDATE())
        `);

      // Gán sinh viên vào lớp học còn slot trống
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

    // Nếu duyệt qua toàn bộ file mà không có ai được add (tất cả đều trùng)
    if (successCount === 0 && skipCount > 0) {
      await transaction.rollback(); // Huỷ transaction trống cho sạch hệ thống
      throw new Error(
        `Tất cả ${skipCount} sinh viên trong file đều đã tồn tại trên hệ thống.`,
      );
    }

    await transaction.commit();
    return { successCount, skipCount };
  } catch (err) {
    // Chỉ rollback nếu transaction đang được mở
    if (transaction._started) {
      await transaction.rollback();
    }
    throw new Error(err.message);
  }
};
