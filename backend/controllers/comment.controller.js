const commentService = require("../services/comment.service");
const { poolPromise, sql } = require("../config/db");

// kiểm tra xem user có quyền xem/chat ở submission này không
const verifyAccess = async (submissionId, userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("sId", sql.Int, submissionId)
        .input("uId", sql.Int, userId)
        .query(`
            SELECT 1 FROM Submissions s
            JOIN Thesis t ON s.thesis_id = t.id
            WHERE s.id = @sId AND (s.student_id = @uId OR t.lecturer_id = @uId)
        `);
    return result.recordset.length > 0;
};

exports.postComment = async (req, res) => {
    const { submission_id, content } = req.body;
    const userId = req.user.id;

    try {
        if (!(await verifyAccess(submission_id, userId))) {
            return res.status(403).json({ message: "Bạn không có quyền trao đổi ở bài nộp này." });
        }
        const comment = await commentService.addComment(submission_id, userId, content);
        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu comment", error: err.message });
    }
};

exports.getComments = async (req, res) => {
    const { submission_id } = req.params;
    const userId = req.user.id;

    try {
        if (!(await verifyAccess(submission_id, userId))) {
            return res.status(403).json({ message: "Bạn không có quyền xem thông tin này." });
        }
        const comments = await commentService.getCommentsBySubmission(submission_id);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách comment", error: err.message });
    }
};