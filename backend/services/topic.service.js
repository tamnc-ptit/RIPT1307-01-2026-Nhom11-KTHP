const { poolPromise, sql } = require("../config/db");
const lecturerService = require("./lecturer.service");

exports.getAllSuggestions = async (filters = {}) => {
  const pool = await poolPromise;
  const { session_id, status } = filters;
  const request = pool.request().input("sessionId", sql.Int, session_id || null).input("status", sql.NVarChar, status || null);

  let where = "1=1";
  if (session_id) where += " AND ts.session_id = @sessionId";
  if (status) where += " AND ts.status = @status";

  const result = await request.query(`
    SELECT ts.*, u.name AS lecturer_name, s.semester AS session_name
    FROM TopicSuggestions ts
    LEFT JOIN Users u ON ts.lecturer_id = u.id
    LEFT JOIN Sessions s ON ts.session_id = s.id
    WHERE ${where}
    ORDER BY ts.created_at DESC
  `);

  return result.recordset;
};

exports.getSuggestionById = async (id) => {
  const pool = await poolPromise;
  const suggestionRes = await pool.request().input("id", sql.Int, id).query(`
    SELECT ts.*, u.name AS lecturer_name, s.semester AS session_name
    FROM TopicSuggestions ts
    LEFT JOIN Users u ON ts.lecturer_id = u.id
    LEFT JOIN Sessions s ON ts.session_id = s.id
    WHERE ts.id = @id
  `);

  const suggestion = suggestionRes.recordset[0];
  if (!suggestion) return null;

  return suggestion;
};

exports.addComment = async (suggestionId, userId, content) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("suggestionId", sql.Int, suggestionId)
    .input("userId", sql.Int, userId)
    .input("content", sql.NVarChar, content)
    .query(`
      INSERT INTO TopicComments (suggestion_id, user_id, content, created_at)
      OUTPUT INSERTED.*
      VALUES (@suggestionId, @userId, @content, GETDATE())
    `);
  return res.recordset[0];
};

exports.registerSuggestion = async (suggestionId, studentId) => {
  const pool = await poolPromise;

  // Get suggestion details
  const sugRes = await pool.request().input("id", sql.Int, suggestionId).query("SELECT * FROM TopicSuggestions WHERE id = @id");
  const suggestion = sugRes.recordset[0];
  if (!suggestion) throw new Error("Đề xuất không tồn tại");

  // Prevent duplicate registration
  const used = await pool.request().input("suggestionId", sql.Int, suggestionId).input("studentId", sql.Int, studentId)
    .query("SELECT TOP 1 id FROM Thesis WHERE suggestion_id = @suggestionId OR student_id = @studentId");
  if (used.recordset.length > 0) {
    throw new Error("Sinh viên đã đăng ký đề tài hoặc đề tài đã có người đăng ký");
  }

  // Insert a Thesis record linking to suggestion
  const insertRes = await pool.request()
    .input("title", sql.NVarChar, suggestion.title)
    .input("description", sql.NVarChar, suggestion.description || null)
    .input("student_id", sql.Int, studentId)
    .input("lecturer_id", sql.Int, suggestion.lecturer_id || null)
    .input("session_id", sql.Int, suggestion.session_id || null)
    .input("suggestion_id", sql.Int, suggestionId)
    .query(`
      INSERT INTO Thesis (title, description, student_id, lecturer_id, session_id, suggestion_id, lecturer_status, admin_status, status, created_at)
      OUTPUT INSERTED.*
      VALUES (@title, @description, @student_id, @lecturer_id, @session_id, @suggestion_id, 'pending', 'pending', 'registered', GETDATE())
    `);

  const thesis = insertRes.recordset[0];

  // Notify lecturer (if exists)
  if (suggestion.lecturer_id) {
    await lecturerService.createNotification({
      user_id: suggestion.lecturer_id,
      type: "suggestion_registered",
      title: "Sinh viên đăng ký đề xuất",
      message: `Một sinh viên đã đăng ký đề tài gợi ý: ${suggestion.title}`,
      ref_type: "topic_suggestion",
      ref_id: suggestionId
    });
  }

  return thesis;
};

module.exports = exports;
