const { poolPromise, sql } = require("../config/db");

// 1. Dành riêng cho cột trái (Mục tiêu & Kế hoạch)
const getMilestonesByThesis = async (thesisId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT id, thesis_id, title, description, deadline, status
      FROM Milestones
      WHERE thesis_id = @thesisId
      ORDER BY deadline ASC
    `);
  return result.recordset;
};

// 2. Dành riêng cho cột phải (Lịch sử nộp)
const getProgressByThesis = async (thesisId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
          s.id AS submission_id,
          s.milestone_id,
          m.title AS milestone_title,
          s.file_name,
          s.file_url,
          s.note AS description,
          s.score,
          s.status AS submission_status,
          s.submitted_at AS created_at
      FROM Submissions s
      JOIN Milestones m ON s.milestone_id = m.id
      WHERE s.thesis_id = @thesisId
      ORDER BY s.submitted_at DESC
    `);
  
  return result.recordset;
};

// 3. API Nộp bài - Đã tích hợp luồng CHẶN TIẾN ĐỘ theo Deadline
const createProgress = async (data) => {
  const { milestone_id, thesis_id, student_id, file_name, file_url, description } = data;
  const pool = await poolPromise;

  // Bước 1: Lấy deadline của mốc hiện tại
  const currentMilestone = await pool.request()
    .input("id", sql.Int, milestone_id)
    .query("SELECT deadline FROM Milestones WHERE id = @id");

  const currentDeadline = currentMilestone.recordset[0]?.deadline;

  // Bước 2: Chặn nếu có mốc TRƯỚC ĐÓ (deadline cũ hơn) chưa được chấm điểm
  if (currentDeadline) {
    const checkPrev = await pool.request()
      .input("thesis_id", sql.Int, thesis_id)
      .input("current_deadline", sql.Date, currentDeadline)
      .query(`
        SELECT m.id 
        FROM Milestones m
        LEFT JOIN Submissions s ON m.id = s.milestone_id AND s.status = 'graded'
        WHERE m.thesis_id = @thesis_id 
          AND m.deadline < @current_deadline
          AND s.id IS NULL -- Không có bài nộp nào đã graded cho mốc trước đó
      `);

    if (checkPrev.recordset.length > 0) {
      throw new Error("Bạn chưa hoàn thành (chưa được chấm điểm) các mốc trước đó!");
    }
  }

  // Bước 3: Nếu hợp lệ -> Lưu bài
  const result = await pool
    .request()
    .input("milestone_id", sql.Int, milestone_id) 
    .input("thesis_id", sql.Int, thesis_id)
    .input("student_id", sql.Int, student_id || null)
    .input("file_name", sql.NVarChar, file_name)
    .input("file_url", sql.VarChar, file_url)
    .input("note", sql.NVarChar, description || null)
    .query(`
      INSERT INTO Submissions (milestone_id, thesis_id, student_id, file_name, file_url, note, status, submitted_at)
      OUTPUT INSERTED.*
      VALUES (@milestone_id, @thesis_id, @student_id, @file_name, @file_url, @note, 'submitted', GETDATE())
    `);
    
  return result.recordset[0];
};

// 4. Cập nhật trạng thái Milestone
const updateMilestoneStatus = async (id, status) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, id)
    .input("status", sql.VarChar, status)
    .query(`
      UPDATE Milestones 
      SET status = @status 
      WHERE id = @id
    `);
  return true;
};

// 5. Thêm Milestone mới (Dành cho chức năng tạo mốc)
const createMilestone = async (data) => {
  const { thesis_id, title, description, deadline, created_by = 5 } = data;
  const pool = await poolPromise;
  
  let formattedDate = null;
  if (deadline) {
    const [day, month, year] = deadline.split('/');
    if (day && month && year) {
      formattedDate = `${year}-${month}-${day}`;
    }
  }

  const result = await pool
    .request()
    .input("thesis_id", sql.Int, thesis_id)
    .input("created_by", sql.Int, created_by)
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || '')
    .input("deadline", sql.Date, formattedDate || null)
    .query(`
      INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status)
      OUTPUT INSERTED.*
      VALUES (@thesis_id, @created_by, @title, @description, @deadline, 'pending')
    `);

  return result.recordset[0];
};

// 6. Xóa bài nộp 
const deleteSubmission = async (submissionId, studentId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, parseInt(submissionId))
    .input("student_id", sql.Int, parseInt(studentId)) 
    .query(`
      DELETE FROM Submissions 
      WHERE id = @id AND student_id = @student_id
    `); 
  
  return result.rowsAffected[0] > 0; 
};

module.exports = {
  getMilestonesByThesis, 
  getProgressByThesis,
  createProgress,
  updateMilestoneStatus,
  createMilestone,
  deleteSubmission
};