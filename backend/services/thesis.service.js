const { poolPromise, sql } = require("../config/db");

exports.getAllThesis = async (keyword, lecturerId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("keyword", sql.NVarChar, keyword || null)
    .input("lecturerId", sql.Int, lecturerId || null)
    .query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.student_id,
        t.lecturer_id,
        t.class_id,
        t.status,
        t.reject_reason,
        t.final_score,
        s.name AS studentName,
        l.name AS supervisorName
      FROM Thesis t
      LEFT JOIN Users s ON t.student_id = s.id
      LEFT JOIN Users l ON t.lecturer_id = l.id
      WHERE (@keyword IS NULL OR t.title LIKE '%' + @keyword + '%')
        AND (@lecturerId IS NULL OR t.lecturer_id = @lecturerId)
      ORDER BY t.id DESC
    `);

  return result.recordset;
};

// CREATE
exports.createThesis = async (data) => {
  const { title, description, student_id, lecturer_id, class_id } = data;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("student_id", sql.Int, student_id)
    .input("lecturer_id", sql.Int, lecturer_id || null)
    .input("class_id", sql.Int, class_id || null).query(`
      INSERT INTO Thesis (title, description, student_id, lecturer_id, class_id, status)
      OUTPUT INSERTED.*
      VALUES (@title, @description, @student_id, @lecturer_id, @class_id, 'Pending')
    `);

  return result.recordset[0];
};

// UPDATE (Hỗ trợ cả Sửa nội dung, Duyệt, Từ chối và Gán GV)
exports.updateThesis = async (id, data) => {
  const { title, description, student_id, lecturer_id, status, rejectReason, finalScore, class_id } =
    data;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("title", sql.NVarChar, title || null)
    .input("description", sql.NVarChar, description || null)
    .input("student_id", sql.Int, student_id || null)
    .input("lecturer_id", sql.Int, lecturer_id || null)
    .input("status", sql.NVarChar, status || null)
    .input("reject_reason", sql.NVarChar, rejectReason || null)
    .input("final_score", sql.Decimal(4, 2), finalScore || null)
    .input("class_id", sql.Int, class_id || null).query(`
      UPDATE Thesis
      SET 
          title = ISNULL(@title, title),
          description = ISNULL(@description, description), 
          student_id = ISNULL(@student_id, student_id), 
          lecturer_id = ISNULL(@lecturer_id, lecturer_id),
          status = ISNULL(@status, status),
          reject_reason = ISNULL(@reject_reason, reject_reason),
          final_score = ISNULL(@final_score, final_score),
          class_id = ISNULL(@class_id, class_id),
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @id;
    `);

  return result.recordset[0];
};

// DELETE
exports.deleteThesis = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, parseInt(id))
    .query(`DELETE FROM Thesis WHERE id = @id`);

  return result.rowsAffected[0];
};
// Lấy danh sách giảng viên để gán hướng dẫn
exports.getSupervisors = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      u.id, 
      u.name, 
      -- Đếm số đề tài đã duyệt mà GV này đang hướng dẫn
      (SELECT COUNT(*) FROM Thesis t WHERE t.lecturer_id = u.id AND t.status = 'Approved') AS currentSlots,
      5 AS maxSlots -- Bạn có thể để cứng hoặc thêm cột max_slots vào bảng Users
    FROM Users u
    WHERE u.role = 'lecturer' -- Lọc ra những người là giảng viên
  `);
  return result.recordset;
};
// Lấy danh sách đề tài theo ID Lớp
exports.getThesesByClass = async (classId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        t.id, t.title, t.status, 
        u_std.name AS studentName,
        u_lec.name AS supervisorName
      FROM Thesis t
      LEFT JOIN Users u_std ON t.student_id = u_std.id
      LEFT JOIN Users u_lec ON t.lecturer_id = u_lec.id
      WHERE t.class_id = @classId
      ORDER BY t.id DESC
    `);
  return result.recordset;
};

// Lấy danh sách các lớp mà một Giảng viên đang dạy
exports.getClassesByLecturer = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT * FROM Classes WHERE lecturer_id = @lecturerId");
  return result.recordset;
};