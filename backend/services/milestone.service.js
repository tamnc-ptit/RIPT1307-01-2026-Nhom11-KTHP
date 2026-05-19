const { poolPromise, sql } = require("../config/db");

exports.getMilestonesByThesis = async (thesisId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
        m.id,
        m.thesis_id,
        m.title AS name,
        m.description,
        m.deadline,
        m.status,
        s.submitted_at,
        s.file_url AS evidence_url,
        s.score,
        (SELECT TOP 1 c.content FROM Comments c WHERE c.submission_id = s.id ORDER BY c.created_at DESC) AS lecturer_comment
      FROM Milestones m
      LEFT JOIN Submissions s ON s.milestone_id = m.id AND s.thesis_id = m.thesis_id
      WHERE m.thesis_id = @thesisId
      ORDER BY m.deadline ASC
    `);
  return result.recordset;
};

exports.updateMilestoneFeedback = async (id, data) => {
  const { comment, score, status, userId } = data; 
  const pool = await poolPromise;

  // 1. Tìm submission gần nhất của milestone này
  const subRes = await pool
    .request()
    .input("milestoneId", sql.Int, id)
    .query("SELECT TOP 1 id, thesis_id FROM Submissions WHERE milestone_id = @milestoneId ORDER BY submitted_at DESC");

  const submission = subRes.recordset[0];

  if (submission) {
    const submissionId = submission.id;

    // 2. Thêm bình luận mới vào bảng Comments
    if (comment) {
      await pool
        .request()
        .input("submissionId", sql.Int, submissionId)
        .input("userId", sql.Int, userId || 2) // Default to lecturer ID
        .input("content", sql.NVarChar, comment)
        .query("INSERT INTO Comments (submission_id, user_id, content, created_at, updated_at) VALUES (@submissionId, @userId, @content, GETDATE(), GETDATE())");
    }

    // 3. Cập nhật điểm hoặc trạng thái cho Submission
    const reqSub = pool
      .request()
      .input("submissionId", sql.Int, submissionId)
      .input("score", sql.Decimal(5, 2), score !== undefined ? score : null);

    let subQuery = "UPDATE Submissions SET status = 'graded', graded_at = GETDATE()";
    if (score !== undefined && score !== null) {
      subQuery += ", score = @score";
    }
    subQuery += " WHERE id = @submissionId";
    await reqSub.query(subQuery);
  }

  // 4. Cập nhật trạng thái của Milestone
  const finalStatus = status === 'done' || status === 'completed' ? 'completed' : 'pending';
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, finalStatus)
    .query(`
      UPDATE Milestones
      SET 
        status = @status
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  return result.recordset[0];
};

exports.createMilestone = async (data) => {
  const { thesis_id, name, title, description, deadline, created_by } = data;
  const pool = await poolPromise;
  const finalTitle = title || name;
  const finalCreatedBy = created_by || 2; // Default to lecturer ID

  const result = await pool
    .request()
    .input("thesis_id", sql.Int, thesis_id)
    .input("created_by", sql.Int, finalCreatedBy)
    .input("title", sql.NVarChar, finalTitle)
    .input("description", sql.NVarChar, description || null)
    .input("deadline", sql.DateTime, deadline)
    .query(`
      INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status, created_at)
      OUTPUT INSERTED.*
      VALUES (@thesis_id, @created_by, @title, @description, @deadline, 'pending', GETDATE())
    `);
  return result.recordset[0];
};

exports.getMilestoneById = async (id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT * FROM Milestones WHERE id = @id");
  return result.recordset[0];
};
