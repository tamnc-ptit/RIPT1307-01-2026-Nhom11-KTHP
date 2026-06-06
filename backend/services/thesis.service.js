const { poolPromise, sql } = require("../config/db");
const notificationService = require("./notification.service");

const getStudentClassId = async (pool, studentId) => {
  const classRes = await pool
    .request()
    .input("studentId", sql.Int, studentId)
    .query(`
      SELECT TOP 1 class_id
      FROM ClassStudents
      WHERE student_id = @studentId
      ORDER BY joined_at DESC
    `);
  return classRes.recordset[0]?.class_id || null;
};

const resolveActiveSessionId = async (pool) => {
  const sessionRes = await pool
    .request()
    .query("SELECT TOP 1 id FROM Sessions WHERE is_active = 1 ORDER BY created_at DESC");

  if (!sessionRes.recordset?.length) {
    throw new Error(
      "Không có đợt đồ án đang mở. Vui lòng tạo hoặc kích hoạt một Session trước khi đăng ký đề tài.",
    );
  }
  return sessionRes.recordset[0].id;
};

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
        t.suggestion_id,
        t.status,
        t.lecturer_status,
        t.admin_status,
        t.reject_reason,
        t.final_score,
        t.created_at,
        s.name AS student_name,
        l.name AS lecturer_name,
        c.class_name,
        se.name AS session_name,
        ts.title AS suggestion_title
      FROM Thesis t
      LEFT JOIN Users s ON t.student_id = s.id
      LEFT JOIN Classes c ON t.class_id = c.id
      LEFT JOIN Users l ON t.lecturer_id = l.id
      LEFT JOIN Sessions se ON t.session_id = se.id
      LEFT JOIN TopicSuggestions ts ON t.suggestion_id = ts.id
      WHERE t.student_id IS NOT NULL
        AND (t.status IS NULL OR t.status <> 'forum')
        AND t.title NOT LIKE 'DIEN_DAN_CHUNG_LOP_%'
        AND (@keyword IS NULL OR t.title LIKE '%' + @keyword + '%')
        AND (@lecturerId IS NULL OR t.lecturer_id = @lecturerId)
        AND (@adminStatus IS NULL OR t.admin_status = @adminStatus)
        AND (@lecturerStatus IS NULL OR t.lecturer_status = @lecturerStatus)
        AND (@classId IS NULL OR t.class_id = @classId)
        AND (@sessionId IS NULL OR t.session_id = @sessionId)
      ORDER BY t.created_at DESC
    `);

  return result.recordset;
};

exports.createThesis = async (data) => {
  const {
    title,
    description,
    student_id,
    lecturer_id,
    suggestion_id,
    class_id,
    session_id,
  } = data;

  if (!student_id) {
    throw new Error(
      "Không thể tạo đề tài mẫu trong bảng Thesis. Đề tài mẫu phải được lưu trong TopicSuggestions.",
    );
  }

  if (!lecturer_id) {
    throw new Error("Thiếu thông tin giảng viên hướng dẫn (lecturer_id)!");
  }

  const pool = await poolPromise;

  const existing = await pool
    .request()
    .input("student_id", sql.Int, student_id)
    .query(`
      SELECT id FROM Thesis
      WHERE student_id = @student_id
        AND admin_status <> 'rejected'
        AND lecturer_status <> 'rejected'
    `);

  if (existing.recordset.length > 0) {
    throw new Error("Bạn đã đăng ký một đề tài rồi. Đề tài đang chờ duyệt hoặc đã được duyệt.");
  }

  let resolvedTitle = title;
  let resolvedDescription = description || null;
  let resolvedSessionId = session_id || null;
  let resolvedLecturerId = lecturer_id;
  let resolvedSuggestionId = suggestion_id || null;

  if (suggestion_id) {
    const suggestionRes = await pool
      .request()
      .input("id", sql.Int, suggestion_id)
      .query("SELECT * FROM TopicSuggestions WHERE id = @id");

    const suggestion = suggestionRes.recordset[0];
    if (!suggestion) {
      throw new Error("Đề tài gợi ý không tồn tại.");
    }
    if (suggestion.status !== "open") {
      throw new Error("Đề tài gợi ý này hiện không mở đăng ký.");
    }

    const countRes = await pool
      .request()
      .input("suggestionId", sql.Int, suggestion_id)
      .query(`
        SELECT COUNT(*) AS cnt
        FROM Thesis
        WHERE suggestion_id = @suggestionId
          AND admin_status <> 'rejected'
          AND lecturer_status <> 'rejected'
      `);

    const currentCount = countRes.recordset[0]?.cnt || 0;
    if (currentCount >= suggestion.max_groups) {
      throw new Error("Đề tài gợi ý này đã đủ số nhóm đăng ký.");
    }

    resolvedTitle = resolvedTitle || suggestion.title;
    resolvedDescription = resolvedDescription || suggestion.description || null;
    resolvedSessionId = resolvedSessionId || suggestion.session_id;
    resolvedLecturerId = suggestion.lecturer_id;
    resolvedSuggestionId = suggestion.id;
  }

  if (!resolvedTitle) {
    throw new Error("Thiếu tiêu đề đề tài bắt buộc");
  }

  if (!resolvedSessionId) {
    resolvedSessionId = await resolveActiveSessionId(pool);
  }

  let resolvedClassId = class_id || null;
  if (!resolvedClassId) {
    resolvedClassId = await getStudentClassId(pool, student_id);
  }

  const result = await pool
    .request()
    .input("title", sql.NVarChar, resolvedTitle)
    .input("description", sql.NVarChar, resolvedDescription)
    .input("student_id", sql.Int, student_id)
    .input("lecturer_id", sql.Int, resolvedLecturerId)
    .input("suggestion_id", sql.Int, resolvedSuggestionId)
    .input("class_id", sql.Int, resolvedClassId)
    .input("session_id", sql.Int, resolvedSessionId)
    .query(`
      INSERT INTO Thesis (
        title, description, student_id, lecturer_id, suggestion_id, class_id, session_id,
        status, lecturer_status, admin_status, created_at, updated_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @title, @description, @student_id, @lecturer_id, @suggestion_id, @class_id, @session_id,
        'registered', 'pending', 'pending', GETDATE(), GETDATE()
      );
    `);

  const thesis = result.recordset[0];

  if (resolvedLecturerId) {
    try {
      await notificationService.createNotification({
        user_id: resolvedLecturerId,
        type: "thesis_registered",
        title: "Sinh viên đăng ký đề tài mới",
        message: `Sinh viên vừa đăng ký đề tài: ${resolvedTitle}`,
        ref_type: "Thesis",
        ref_id: thesis.id,
      });
    } catch (notifyErr) {
      console.error("Lỗi gửi thông báo đăng ký đề tài:", notifyErr.message);
    }
  }

  return thesis;
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
      (SELECT COUNT(*) FROM Thesis t WHERE t.lecturer_id = u.id AND t.admin_status = 'approved') AS currentSlots,
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
      WHERE t.class_id = @classId AND t.student_id IS NOT NULL
      ORDER BY t.created_at DESC
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
