const { poolPromise, sql } = require("../config/db");
const fs = require("fs");

// GET /api/submissions?thesis_id=1&milestone_id=2&student_id=3
exports.getSubmissionsByThesis = async (thesisId, filters = {}) => {
  const { milestoneId, studentId } = filters;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("thesisId",    sql.Int, thesisId)
    .input("milestoneId", sql.Int, milestoneId || null)
    .input("studentId",   sql.Int, studentId   || null)
    .query(`
      SELECT
        s.id,
        s.milestone_id,
        s.thesis_id,
        s.student_id,
        s.file_name,
        s.file_url,
        s.file_size,
        s.note,
        s.score,
        s.status,
        s.submitted_at,
        s.graded_at,
        m.title       AS milestone_title,
        m.deadline    AS milestone_deadline,
        m.status      AS milestone_status,
        u.name        AS student_name,
        u.email       AS student_email
      FROM Submissions s
      JOIN Milestones m ON m.id = s.milestone_id
      JOIN Users u      ON u.id = s.student_id
      WHERE  (@thesisId IS NULL OR s.thesis_id = @thesisId)
        AND (@milestoneId IS NULL OR s.milestone_id = @milestoneId)
        AND (@studentId   IS NULL OR s.student_id   = @studentId)
      ORDER BY s.submitted_at DESC
    `);

  return result.recordset;
};

// GET /api/submissions/:id
exports.getSubmissionById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        s.*,
        m.title    AS milestone_title,
        m.deadline AS milestone_deadline,
        u.name     AS student_name,
        u.email    AS student_email
      FROM Submissions s
      JOIN Milestones m ON m.id = s.milestone_id
      JOIN Users u      ON u.id = s.student_id
      WHERE s.id = @id
    `);

  return result.recordset[0] || null;
};

// POST /api/submissions  (sau khi multer đã lưu file)
exports.createSubmission = async (
  { milestoneId, thesisId, studentId, note },
  file
) => {
  const pool = await poolPromise;

  // Kiểm tra milestone thuộc đúng thesis và còn active
  const milestoneCheck = await pool
    .request()
    .input("milestoneId", sql.Int, milestoneId)
    .input("thesisId",    sql.Int, thesisId)
    .query(`
      SELECT id, status FROM Milestones
      WHERE id = @milestoneId AND thesis_id = @thesisId
    `);

  if (milestoneCheck.recordset.length === 0) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new Error("Không tìm thấy milestone hoặc milestone không thuộc thesis này");
  }

  if (milestoneCheck.recordset[0].status === "closed") {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    throw new Error("Milestone đã đóng, không thể nộp bài");
  }

  const fileUrl = file.path.replace(/\\/g, "/");

  const result = await pool
    .request()
    .input("milestoneId", sql.Int,      milestoneId)
    .input("thesisId",    sql.Int,      thesisId)
    .input("studentId",   sql.Int,      studentId)
    .input("fileUrl",     sql.NVarChar, fileUrl)
    .input("fileName",    sql.NVarChar, file.originalname)
    .input("fileSize",    sql.BigInt,   file.size)          // BigInt khớp với DB
    .input("note",        sql.NVarChar, note || null)
    .query(`
      INSERT INTO Submissions
        (milestone_id, thesis_id, student_id, file_url, file_name, file_size, note, status)
      VALUES
        (@milestoneId, @thesisId, @studentId, @fileUrl, @fileName, @fileSize, @note, 'submitted')

      SELECT * FROM Submissions WHERE id = SCOPE_IDENTITY();
    `);

  return result.recordset[0];
};

// DELETE /api/submissions/:id
exports.deleteSubmission = async (id) => {
  const pool = await poolPromise;

  const existing = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT id, file_url FROM Submissions WHERE id = @id");

  if (existing.recordset.length === 0) {
    throw new Error("Không tìm thấy submission");
  }

  const { file_url } = existing.recordset[0];
  if (file_url && fs.existsSync(file_url)) {
    fs.unlinkSync(file_url);
  }

  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Submissions WHERE id = @id");
};