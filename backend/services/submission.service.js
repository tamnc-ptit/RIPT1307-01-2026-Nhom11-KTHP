const { poolPromise, sql } = require("../config/db");

/**
 * Lấy lịch sử nộp bài của sinh viên theo Milestone và Đề tài
 */
const getSubmissionsByMilestone = async (milestoneId, thesisId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("milestone_id", sql.Int, milestoneId)
    .input("thesis_id", sql.Int, thesisId)
    .query(`
      SELECT 
        id, 
        milestone_id, 
        thesis_id, 
        student_id, 
        file_name, 
        file_url, 
        note, 
        score, 
        status, 
        submitted_at
      FROM Submissions
      WHERE milestone_id = @milestone_id AND thesis_id = @thesis_id
      ORDER BY submitted_at DESC
    `);
  return result.recordset;
};

/**
 * Tạo mới một bản nộp bài (Submission)
 */
const createSubmission = async (data) => {
  const { milestone_id, thesis_id, student_id, file_name, file_url, note } = data;
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("milestone_id", sql.Int, milestone_id)
    .input("thesis_id", sql.Int, thesis_id)
    .input("student_id", sql.Int, student_id)
    .input("file_name", sql.NVarChar, file_name)
    .input("file_url", sql.VarChar, file_url)
    .input("note", sql.NVarChar, note || null)
    .query(`
      INSERT INTO Submissions (
        milestone_id, 
        thesis_id, 
        student_id, 
        file_name, 
        file_url, 
        note, 
        status, 
        submitted_at
      )
      OUTPUT INSERTED.*
      VALUES (
        @milestone_id, 
        @thesis_id, 
        @student_id, 
        @file_name, 
        @file_url, 
        @note, 
        'submitted', 
        GETDATE()
      )
    `);
    
  return result.recordset[0];
};

module.exports = {
  getSubmissionsByMilestone,
  createSubmission
};