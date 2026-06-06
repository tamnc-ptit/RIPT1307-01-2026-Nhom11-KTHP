const { poolPromise, sql } = require("../config/db");




/**
 * Thêm một comment mới (Tối ưu cho API postComment)
 * @param {number} submissionId
 * @param {number} userId
 * @param {string} content
 * @returns {Promise<Object>}
 */
exports.addComment = async (submissionId, userId, content) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("submissionId", sql.Int, submissionId)
    .input("userId", sql.Int, userId)
    .input("content", sql.NVarChar, content)
    .query(`
      INSERT INTO Comments (submission_id, user_id, content, created_at, updated_at)
      OUTPUT INSERTED.*
      VALUES (@submissionId, @userId, @content, GETDATE(), GETDATE())
    `);
  return result.recordset[0];
};





/**
 * Get all comments for a specific submission
 * Đã merge: Trả về cả 'user_name' và 'sender_name' để tương thích 100% với Frontend
 * @param {number} submissionId
 * @returns {Promise<Array>}
 */
exports.getCommentsBySubmission = async (submissionId) => {
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("submissionId", sql.Int, submissionId)
    .query(`
      SELECT 
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.name AS sender_name, -- Đảm bảo Frontend cũ không bị undefined
        u.role AS user_role,
        u.email AS user_email
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      WHERE c.submission_id = @submissionId
      ORDER BY c.created_at ASC
    `);

  return result.recordset;
};

/**
 * Get a single comment by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
exports.getCommentById = async (id) => {
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT 
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      WHERE c.id = @id
    `);

  return result.recordset[0] || null;
};

/**
 * Create a new comment on a submission (Luồng an toàn có validate cho Giảng viên/Admin)
 * @param {object} data - { submissionId, userId, content }
 * @returns {Promise<Object>}
 */
exports.createComment = async (data) => {
  const { submissionId, userId, content } = data;
  const pool = await poolPromise;

  // Verify submission exists
  const submissionCheck = await pool
    .request()
    .input("submissionId", sql.Int, submissionId)
    .query("SELECT id FROM Submissions WHERE id = @submissionId");

  if (submissionCheck.recordset.length === 0) {
    throw new Error("Không tìm thấy submission");
  }

  // Verify user exists
  const userCheck = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query("SELECT id, name, role FROM Users WHERE id = @userId AND is_active = 1");

  if (userCheck.recordset.length === 0) {
    throw new Error("Người dùng không tồn tại hoặc không hoạt động");
  }

  const now = new Date();
  const result = await pool
    .request()
    .input("submissionId", sql.Int, submissionId)
    .input("userId", sql.Int, userId)
    .input("content", sql.NVarChar(sql.MAX), content)
    .input("now", sql.DateTime, now)
    .query(`
      INSERT INTO Comments (submission_id, user_id, content, created_at, updated_at)
      VALUES (@submissionId, @userId, @content, @now, @now)

      SELECT 
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      WHERE c.id = SCOPE_IDENTITY()
    `);

  return result.recordset[0];
};

/**
 * Update an existing comment
 * @param {number} id - Comment ID
 * @param {object} data - { content }
 * @returns {Promise<Object>}
 */
exports.updateComment = async (id, data) => {
  const { content } = data;
  const pool = await poolPromise;

  // Verify comment exists
  const commentCheck = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT id FROM Comments WHERE id = @id");

  if (commentCheck.recordset.length === 0) {
    throw new Error("Không tìm thấy comment");
  }

  const now = new Date();
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("content", sql.NVarChar(sql.MAX), content)
    .input("now", sql.DateTime, now)
    .query(`
      UPDATE Comments
      SET content = @content, updated_at = @now
      WHERE id = @id

      SELECT 
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      WHERE c.id = @id
    `);

  return result.recordset[0];
};

/**
 * Delete a comment
 * @param {number} id 
 * @returns {Promise<number>} 
 */
exports.deleteComment = async (id) => {
  const pool = await poolPromise;

  // Verify comment exists
  const commentCheck = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT id FROM Comments WHERE id = @id");

  if (commentCheck.recordset.length === 0) {
    throw new Error("Không tìm thấy comment");
  }

  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Comments WHERE id = @id");

  return 1;
};

/**

 * @param {number} thesisId
 * @returns {Promise<Array>}
 */
exports.getCommentsByThesis = async (thesisId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email,
        s.milestone_id,
        m.title AS milestone_title
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      JOIN Submissions s ON s.id = c.submission_id
      JOIN Milestones m ON m.id = s.milestone_id
      WHERE s.thesis_id = @thesisId
      ORDER BY c.created_at DESC
    `);

  return result.recordset;
};

/**
 *
 * @param {number} classId
 * @returns {Promise<Array>}
 */
exports.getCommentsByClass = async (classId) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT
        c.id,
        c.submission_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email,
        s.thesis_id,
        s.file_name,
        s.file_url,
        s.student_id,
        st.name AS student_name,
        t.title AS thesis_title,
        t.class_id,
        t.lecturer_id
      FROM Comments c
      JOIN Users u ON u.id = c.user_id
      JOIN Submissions s ON s.id = c.submission_id
      JOIN Users st ON st.id = s.student_id
      JOIN Thesis t ON t.id = s.thesis_id
      WHERE t.class_id = @classId
      ORDER BY c.created_at DESC
    `);

  return result.recordset;
};