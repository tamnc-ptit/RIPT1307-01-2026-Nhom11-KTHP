const { poolPromise, sql } = require("../config/db");

// Thêm một comment mới
exports.addComment = async (submissionId, userId, content) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("submissionId", sql.Int, submissionId)
        .input("userId", sql.Int, userId)
        .input("content", sql.NVarChar, content)
        .query(`
            INSERT INTO Comments (submission_id, user_id, content, created_at)
            OUTPUT INSERTED.*
            VALUES (@submissionId, @userId, @content, GETDATE())
        `);
    return result.recordset[0];
};

// Lấy lịch sử comment kèm tên người gửi 
exports.getCommentsBySubmission = async (submissionId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("submissionId", sql.Int, submissionId)
        .query(`
            SELECT c.*, u.name AS sender_name 
            FROM Comments c
            INNER JOIN Users u ON c.user_id = u.id
            WHERE c.submission_id = @submissionId
            ORDER BY c.created_at ASC
        `);
    return result.recordset;
};