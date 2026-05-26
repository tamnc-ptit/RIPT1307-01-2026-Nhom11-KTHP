const { poolPromise, sql } = require("../config/db");

// Dành riêng cho Lecturer
exports.getLecturerClasses = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT * FROM Classes WHERE lecturer_id = @lecturerId");
  return result.recordset;
};

exports.getLecturerClassStudents = async (classId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        u.id AS studentId,
        u.name AS studentName,
        t.id AS thesisId,
        t.title AS topicName,
        t.lecturer_status,
        t.admin_status,
        t.lecturer_note,
        t.final_score
      FROM ClassStudents cs
      JOIN Users u ON cs.student_id = u.id
      LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
      WHERE cs.class_id = @classId
    `);
  return result.recordset.map(row => {
    // Ưu tiên final_score thật, fallback lecturer_note cũ
    let finalScore = row.final_score ?? null;
    if (finalScore === null && row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
      finalScore = parseFloat(row.lecturer_note.split("=")[1]);
    }
    return {
      ...row,
      finalScore
    };
  });
};
