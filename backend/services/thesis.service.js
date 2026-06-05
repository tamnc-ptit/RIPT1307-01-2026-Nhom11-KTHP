const { poolPromise, sql } = require("../config/db");

exports.getAllThesis = async (filterParams) => {
  const { keyword, lecturerId, adminStatus, lecturerStatus, classId, sessionId } = filterParams;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("keyword", sql.NVarChar, keyword || null)
    .input("lecturerId", sql.Int, lecturerId || null)
    .input("adminStatus", sql.NVarChar, adminStatus || null)
    .input("lecturerStatus", sql.NVarChar, lecturerStatus || null)
    .input("classId", sql.Int, classId || null)
    .input("sessionId", sql.Int, sessionId || null)
    .query(`
      SELECT 
        t.id,                        
        t.title,
        t.description,
        t.student_id,
        t.lecturer_id,
        t.class_id,
        t.session_id,                
        t.status,
        t.lecturer_status,           
        t.admin_status,              
        t.reject_reason,
        t.final_score,
        t.created_at,                
        s.name AS student_name,      
        l.name AS lecturer_name,     
        c.class_name,                
        se.name AS session_name      
      FROM Thesis t                  
      LEFT JOIN Users s ON t.student_id = s.id
      LEFT JOIN Classes c ON t.class_id = c.id
      LEFT JOIN Users l ON t.lecturer_id = l.id
      LEFT JOIN Sessions se ON t.session_id = se.id 
      WHERE (@keyword IS NULL OR t.title LIKE '%' + @keyword + '%')
        AND (@lecturerId IS NULL OR t.lecturer_id = @lecturerId)
        AND (@adminStatus IS NULL OR t.admin_status = @adminStatus)
        AND (@lecturerStatus IS NULL OR t.lecturer_status = @lecturerStatus)
        AND (@classId IS NULL OR t.class_id = @classId)
        AND (@sessionId IS NULL OR t.session_id = @sessionId)
      ORDER BY t.id DESC
    `);

  return result.recordset;
};


exports.createThesis = async (data) => {
  const {
    title, description, student_id, lecturer_id, suggestion_id, class_id,
    session_id, status, lecturer_status, admin_status, reject_reason, final_score,
  } = data;

  const pool = await poolPromise;

  // 1. Logic của BẠN: Kiểm tra sinh viên đã đăng ký chưa
  if (student_id) {
    const checkExist = await pool
      .request()
      .input("student_id", sql.Int, student_id)
      .query("SELECT id FROM Thesis WHERE student_id = @student_id AND admin_status != 'rejected'");

    if (checkExist.recordset.length > 0) {
      throw new Error("Bạn đã đăng ký một đề tài rồi. Đề tài đang chờ duyệt hoặc đã được duyệt.");
    }
  }

  // 2. Logic của ĐỒNG ĐỘI: Tự động lấy session_id nếu bị thiếu
  let resolvedSessionId = session_id;
  if (!resolvedSessionId) {
    const sessionRes = await pool
      .request()
      .query("SELECT TOP 1 id FROM Sessions WHERE is_active = 1 ORDER BY created_at DESC");
    if (sessionRes.recordset && sessionRes.recordset.length > 0) {
      resolvedSessionId = sessionRes.recordset[0].id;
    } else {
      throw new Error("Không có đợt đồ án đang mở. Vui lòng tạo hoặc kích hoạt một 'Session' trước khi thêm đề tài.");
    }
  }

  // 3. Thực thi Insert dữ liệu
  const result = await pool
    .request()
    .input("title", sql.NVarChar, title || null)
    .input("description", sql.NVarChar, description || null)
    .input("student_id", sql.Int, student_id || null)
    .input("lecturer_id", sql.Int, lecturer_id || null)
    .input("suggestion_id", sql.Int, suggestion_id || null)
    .input("class_id", sql.Int, class_id || null)
    .input("session_id", sql.Int, resolvedSessionId)
    .input("status", sql.NVarChar, status || "pending")
    .input("lecturer_status", sql.NVarChar, lecturer_status || "pending")
    .input("admin_status", sql.NVarChar, admin_status || "pending")
    .input("reject_reason", sql.NVarChar, reject_reason || null)
    .input("final_score", sql.Float, final_score || null)
    .query(`
      INSERT INTO Thesis (
        title, description, student_id, lecturer_id, suggestion_id, class_id, session_id,
        status, lecturer_status, admin_status, reject_reason, final_score, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @title, @description, @student_id, @lecturer_id, @suggestion_id, @class_id, @session_id,
        @status, @lecturer_status, @admin_status, @reject_reason, @final_score, GETDATE(), GETDATE()
      );
    `);

  return result.recordset[0];
};

exports.updateThesis = async (id, data) => {
  const {
    title, description, student_id, lecturer_id, status,
    rejectReason, finalScore, class_id,
  } = data;
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
    .input("final_score", sql.Float, finalScore || null)
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

exports.deleteThesis = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, parseInt(id))
    .query(`DELETE FROM Thesis WHERE id = @id`);

  return result.rowsAffected[0];
};

exports.getSupervisors = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      u.id, 
      u.name, 
      (SELECT COUNT(*) FROM Thesis t WHERE t.lecturer_id = u.id AND t.status = 'approved') AS currentSlots,
      5 AS maxSlots 
    FROM Users u
    WHERE u.role = 'lecturer'
  `);
  return result.recordset;
};

exports.getThesesByClass = async (classId) => {
  const pool = await poolPromise;
  const result = await pool.request().input("classId", sql.Int, classId).query(`
      SELECT 
        t.id, t.title, t.status, 
        u_std.name AS student_name,
        u_lec.name AS lecturer_name
      FROM Thesis t
      LEFT JOIN Users u_std ON t.student_id = u_std.id
      LEFT JOIN Users u_lec ON t.lecturer_id = u_lec.id
      WHERE t.class_id = @classId
      ORDER BY t.id DESC
    `);
  return result.recordset;
};

exports.getClassesByLecturer = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT * FROM Classes WHERE lecturer_id = @lecturerId");
  return result.recordset;
};