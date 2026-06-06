const { poolPromise, sql } = require("../config/db");
const lecturerService = require("./lecturer.service");

exports.getAllSuggestions = async (filters = {}) => {
  const pool = await poolPromise;
  const { session_id, status, lecturerId } = filters;
  const request = pool
    .request()
    .input("sessionId", sql.Int, session_id || null)
    .input("status", sql.NVarChar, status || null)
    .input("lecturerId", sql.Int, lecturerId || null);

  let where = "1=1";
  if (session_id) where += " AND ts.session_id = @sessionId";
  if (status) where += " AND ts.status = @status";
  if (lecturerId) where += " AND ts.lecturer_id = @lecturerId";

  const result = await request.query(`
    SELECT
      ts.*,
      u.name AS lecturer_name,
      s.name AS session_name,
      (
        SELECT COUNT(*)
        FROM Thesis t
        WHERE t.suggestion_id = ts.id
          AND t.admin_status <> 'rejected'
          AND t.lecturer_status <> 'rejected'
      ) AS registration_count
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
    SELECT ts.*, u.name AS lecturer_name, s.name AS session_name
    FROM TopicSuggestions ts
    LEFT JOIN Users u ON ts.lecturer_id = u.id
    LEFT JOIN Sessions s ON ts.session_id = s.id
    WHERE ts.id = @id
  `);

  return suggestionRes.recordset[0] || null;
};

exports.registerSuggestion = async (suggestionId, studentId, overrides = {}) => {
  const thesisService = require("./thesis.service");
  return thesisService.createThesis({
    suggestion_id: suggestionId,
    student_id: studentId,
    title: overrides.title,
    description: overrides.description,
    lecturer_id: overrides.lecturer_id,
  });
};

module.exports = exports;
