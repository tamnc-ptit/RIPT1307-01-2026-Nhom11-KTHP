const { poolPromise, sql } = require("../config/db");

const parseThesisRow = (row) => {
  let final_score = null;
  if (row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
    final_score = parseFloat(row.lecturer_note.split("=")[1]);
  }
  
  let status = 'Pending';
  if (row.student_id === null) {
    status = 'Pending'; 
  } else if (row.lecturer_status === 'rejected' || row.admin_status === 'rejected') {
    status = 'Rejected';
  } else if (row.lecturer_status === 'approved') {
    if (final_score !== null) {
      status = 'Completed';
    } else {
      status = 'Approved';
    }
  }
  
  return {
    ...row,
    final_score,
    status
  };
};

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
        t.lecturer_status,
        t.admin_status,
        t.lecturer_note,
        t.reject_reason,
        std.name AS studentName,
        lec.name AS supervisorName,
        t.created_at
      FROM Thesis t
      LEFT JOIN Users std ON t.student_id = std.id
      LEFT JOIN Users lec ON t.lecturer_id = lec.id
      LEFT JOIN Classes c ON t.class_id = c.id
      WHERE (@keyword IS NULL OR t.title LIKE '%' + @keyword + '%')
        AND (@lecturerId IS NULL OR c.lecturer_id = @lecturerId OR (t.class_id IS NULL AND t.lecturer_id = @lecturerId))

      UNION ALL

      SELECT
        -ts.id AS id,
        ts.title,
        ts.description,
        NULL AS student_id,
        ts.lecturer_id,
        NULL AS class_id,
        'open' AS lecturer_status,
        'open' AS admin_status,
        NULL AS lecturer_note,
        NULL AS reject_reason,
        NULL AS studentName,
        lec.name AS supervisorName,
        ts.created_at
      FROM TopicSuggestions ts
      LEFT JOIN Users lec ON ts.lecturer_id = lec.id
      WHERE (@keyword IS NULL OR ts.title LIKE '%' + @keyword + '%')
        AND (@lecturerId IS NULL OR ts.lecturer_id = @lecturerId)
        AND ts.id NOT IN (SELECT suggestion_id FROM Thesis WHERE suggestion_id IS NOT NULL)
      ORDER BY id DESC
    `);

  return result.recordset.map(parseThesisRow);
};

// CREATE
exports.createThesis = async (data) => {
  const { title, description, student_id, lecturer_id, class_id } = data;
  const pool = await poolPromise;

  if (!student_id) {
    // Lecturer suggesting a topic
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("lecturer_id", sql.Int, lecturer_id)
      .input("class_id", sql.Int, class_id || null)
      .query(`
        DECLARE @sessionId INT;
        IF @class_id IS NOT NULL
          SELECT @sessionId = session_id FROM Classes WHERE id = @class_id;
        IF @sessionId IS NULL
          SELECT TOP 1 @sessionId = id FROM Sessions WHERE is_active = 1;
        IF @sessionId IS NULL
          SELECT TOP 1 @sessionId = id FROM Sessions ORDER BY id DESC;

        INSERT INTO TopicSuggestions (session_id, lecturer_id, title, description, max_groups, status, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@sessionId, @lecturer_id, @title, @description, 1, 'open', GETDATE(), GETDATE())
      `);
    const row = result.recordset[0];
    return parseThesisRow({
      ...row,
      id: -row.id, // negative ID to represent open suggestions
      student_id: null,
      lecturer_status: 'open',
      admin_status: 'open'
    });
  } else {
    // Registering a thesis directly for a student
    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || null)
      .input("student_id", sql.Int, student_id)
      .input("lecturer_id", sql.Int, lecturer_id)
      .input("class_id", sql.Int, class_id || null)
      .query(`
        DECLARE @sessionId INT;
        IF @class_id IS NOT NULL
          SELECT @sessionId = session_id FROM Classes WHERE id = @class_id;
        IF @sessionId IS NULL
          SELECT TOP 1 @sessionId = id FROM Sessions WHERE is_active = 1;
        IF @sessionId IS NULL
          SELECT TOP 1 @sessionId = id FROM Sessions ORDER BY id DESC;

        INSERT INTO Thesis (session_id, class_id, student_id, lecturer_id, title, description, lecturer_status, admin_status, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@sessionId, @class_id, @student_id, @lecturer_id, @title, @description, 'pending', 'pending', GETDATE(), GETDATE())
      `);
    return parseThesisRow(result.recordset[0]);
  }
};

// UPDATE
exports.updateThesis = async (id, data) => {
  const { title, description, student_id, lecturer_id, status, rejectReason, finalScore, class_id } =
    data;
  const pool = await poolPromise;
  const paramId = parseInt(id);

  if (paramId < 0) {
    // Update TopicSuggestions
    const result = await pool
      .request()
      .input("id", sql.Int, -paramId)
      .input("title", sql.NVarChar, title || null)
      .input("description", sql.NVarChar, description || null)
      .query(`
        UPDATE TopicSuggestions
        SET 
          title = ISNULL(@title, title),
          description = ISNULL(@description, description),
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    const row = result.recordset[0];
    if (!row) return null;
    return parseThesisRow({
      ...row,
      id: paramId,
      student_id: null,
      lecturer_status: 'open',
      admin_status: 'open'
    });
  } else {
    // Update Thesis
    let lecturerStatus = null;
    if (status === 'Approved' || status === 'approved') lecturerStatus = 'approved';
    if (status === 'Rejected' || status === 'rejected') lecturerStatus = 'rejected';
    if (status === 'Pending' || status === 'pending') lecturerStatus = 'pending';

    let note = null;
    if (finalScore !== undefined && finalScore !== null) {
      note = `final_score=${finalScore}`;
    }

    const result = await pool
      .request()
      .input("id", sql.Int, paramId)
      .input("title", sql.NVarChar, title || null)
      .input("description", sql.NVarChar, description || null)
      .input("student_id", sql.Int, student_id || null)
      .input("lecturer_id", sql.Int, lecturer_id || null)
      .input("lecturerStatus", sql.NVarChar, lecturerStatus)
      .input("reject_reason", sql.NVarChar, rejectReason || null)
      .input("note", sql.NVarChar, note)
      .input("class_id", sql.Int, class_id || null)
      .query(`
        UPDATE Thesis
        SET 
          title = ISNULL(@title, title),
          description = ISNULL(@description, description), 
          student_id = ISNULL(@student_id, student_id), 
          lecturer_id = ISNULL(@lecturer_id, lecturer_id),
          lecturer_status = ISNULL(@lecturerStatus, lecturer_status),
          reject_reason = ISNULL(@reject_reason, reject_reason),
          lecturer_note = ISNULL(@note, lecturer_note),
          class_id = ISNULL(@class_id, class_id),
          updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id;
      `);
    if (!result.recordset[0]) return null;
    return parseThesisRow(result.recordset[0]);
  }
};

// DELETE
exports.deleteThesis = async (id) => {
  const pool = await poolPromise;
  const paramId = parseInt(id);
  let query = "";
  let actualId = paramId;
  if (paramId < 0) {
    query = "DELETE FROM TopicSuggestions WHERE id = @id";
    actualId = -paramId;
  } else {
    query = "DELETE FROM Thesis WHERE id = @id";
  }

  const result = await pool
    .request()
    .input("id", sql.Int, actualId)
    .query(query);

  return result.rowsAffected[0];
};

// Lấy danh sách giảng viên để gán hướng dẫn
exports.getSupervisors = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      u.id, 
      u.name, 
      (SELECT COUNT(*) FROM Thesis t WHERE t.lecturer_id = u.id AND t.lecturer_status = 'approved') AS currentSlots,
      5 AS maxSlots
    FROM Users u
    WHERE u.role = 'lecturer'
  `);
  return result.recordset;
};

// Lấy danh sách đề tài theo ID Lớp
exports.getThesesByClass = async (classId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        t.id, t.title, t.lecturer_status, t.admin_status, t.lecturer_note,
        u_std.name AS studentName,
        u_lec.name AS supervisorName
      FROM Thesis t
      LEFT JOIN Users u_std ON t.student_id = u_std.id
      LEFT JOIN Users u_lec ON t.lecturer_id = u_lec.id
      WHERE t.class_id = @classId
      ORDER BY t.id DESC
    `);
  return result.recordset.map(parseThesisRow);
};

// Lấy danh sách các lớp mà một Giảng viên đang dạy
exports.getClassesByLecturer = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT * FROM Classes WHERE lecturer_id = @lecturerId");
  return result.recordset;
};