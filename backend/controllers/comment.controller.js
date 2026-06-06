const commentService = require("../services/comment.service");
const { poolPromise, sql } = require("../config/db");

/**
 * GET /api/lecturer/comments/submission/:submissionId
 * Get all comments for a submission
 */
exports.getCommentsBySubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "submissionId không hợp lệ" });
    }

    // Verify submission exists and belongs to a thesis where user is lecturer
    const pool = await poolPromise;
    const submissionCheck = await pool
      .request()
      .input("submissionId", sql.Int, parseInt(submissionId))
      .query(`
        SELECT s.id, s.thesis_id, t.lecturer_id
        FROM Submissions s
        JOIN Thesis t ON t.id = s.thesis_id
        WHERE s.id = @submissionId
      `);

    if (submissionCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Submission không tồn tại" });
    }

    const { lecturer_id } = submissionCheck.recordset[0];
    if (lecturer_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem comment của submission này" });
    }

    const comments = await commentService.getCommentsBySubmission(parseInt(submissionId));
    res.json({ data: comments, total: comments.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách comment", error: err.message });
  }
};

/**
 * GET /api/lecturer/comments/thesis/:thesisId
 * Get all comments for a thesis (across all submissions)
 */
exports.getCommentsByThesis = async (req, res) => {
  try {
    const { thesisId } = req.params;

    if (!thesisId || isNaN(thesisId)) {
      return res.status(400).json({ message: "thesisId không hợp lệ" });
    }

    // Verify thesis exists and user is the lecturer
    const pool = await poolPromise;
    const thesisCheck = await pool
      .request()
      .input("thesisId", sql.Int, parseInt(thesisId))
      .query("SELECT id, lecturer_id FROM Thesis WHERE id = @thesisId");

    if (thesisCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Thesis không tồn tại" });
    }

    const { lecturer_id } = thesisCheck.recordset[0];
    if (lecturer_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem comment của thesis này" });
    }

    const comments = await commentService.getCommentsByThesis(parseInt(thesisId));
    res.json({ data: comments, total: comments.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách comment", error: err.message });
  }
};

/**
 * GET /api/lecturer/comments/class/:classId
 * Get all comments for a class
 */
exports.getCommentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({ message: "classId không hợp lệ" });
    }

    // Verify class exists
    const pool = await poolPromise;
    const classCheck = await pool
      .request()
      .input("classId", sql.Int, parseInt(classId))
      .query("SELECT id, lecturer_id FROM Classes WHERE id = @classId");

    if (classCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Lớp không tồn tại" });
    }

    const { lecturer_id } = classCheck.recordset[0];

    // Allow access to the lecturer of the class, admins, or students who belong to the class
    let allowed = false;
    if (req.user.role === "admin") allowed = true;
    if (req.user.role === "lecturer" && lecturer_id === req.user.id) allowed = true;
    if (req.user.role === "student") {
      const membership = await pool
        .request()
        .input("classId", sql.Int, parseInt(classId))
        .input("studentId", sql.Int, req.user.id)
        .query("SELECT class_id FROM ClassStudents WHERE class_id = @classId AND student_id = @studentId");
      if (membership.recordset.length > 0) allowed = true;
    }

    if (!allowed) return res.status(403).json({ message: "Bạn không có quyền xem diễn đàn của lớp này" });

    const comments = await commentService.getCommentsByClass(parseInt(classId));
    res.json({ data: comments, total: comments.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách diễn đàn lớp", error: err.message });
  }
};

/**
 * Ensure a "forum anchor" submission exists for a class and return its submission_id
 * This creates minimal Thesis/Milestone/Submission records if necessary.
 */
async function ensureClassForumSubmission(classId) {
  const pool = await poolPromise;
  const now = new Date();

  // Check if there's a thesis created as forum anchor for this class
  const thRes = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("SELECT id FROM Thesis WHERE class_id = @classId AND title LIKE 'DIEN_DAN_CHUNG_LOP_%'");

  let thesisId;
  if (thRes.recordset.length > 0) {
    thesisId = thRes.recordset[0].id;
  } else {
    // find a session to attach
    const sRes = await pool.request().query("SELECT TOP 1 id FROM Sessions WHERE is_active = 1 ORDER BY id ASC");
    let sessionId = sRes.recordset.length > 0 ? sRes.recordset[0].id : null;
    if (!sessionId) {
      const sAll = await pool.request().query("SELECT TOP 1 id FROM Sessions ORDER BY id ASC");
      sessionId = sAll.recordset.length > 0 ? sAll.recordset[0].id : null;
    }

    // Get class's lecturer as thesis.lecturer_id
    const cRes = await pool
      .request()
      .input("classId", sql.Int, classId)
      .query("SELECT lecturer_id FROM Classes WHERE id = @classId");
    const lecturerId = cRes.recordset[0].lecturer_id;

    const title = `DIEN_DAN_CHUNG_LOP_${classId}`;

    const insertTh = await pool
      .request()
      .input("sessionId", sql.Int, sessionId)
      .input("classId", sql.Int, classId)
      .input("lecturerId", sql.Int, lecturerId)
      .input("title", sql.NVarChar(255), title)
      .input("now", sql.DateTime, now)
      .query(`
        INSERT INTO Thesis (session_id, class_id, lecturer_id, title, lecturer_status, admin_status, created_at, updated_at, status)
        VALUES (@sessionId, @classId, @lecturerId, @title, 'approved', 'approved', @now, @now, 'forum')
        SELECT SCOPE_IDENTITY() AS id
      `);

    thesisId = insertTh.recordset[0].id;
  }

  // Now find or create a milestone for this thesis to attach submissions
  const mRes = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query("SELECT id FROM Milestones WHERE thesis_id = @thesisId AND title = 'FORUM_ANCHOR'");

  let milestoneId;
  if (mRes.recordset.length > 0) {
    milestoneId = mRes.recordset[0].id;
  } else {
    // use lecturer as created_by if available
    const tRes = await pool.request().input("thesisId", sql.Int, thesisId).query("SELECT lecturer_id FROM Thesis WHERE id = @thesisId");
    const createdBy = tRes.recordset[0].lecturer_id || null;
    const insertM = await pool
      .request()
      .input("thesisId", sql.Int, thesisId)
      .input("createdBy", sql.Int, createdBy)
      .input("now", sql.DateTime, now)
      .query(`
        INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status, created_at)
        VALUES (@thesisId, @createdBy, 'FORUM_ANCHOR', 'Anchor milestone for class forum', @now, 'completed', @now);
        SELECT SCOPE_IDENTITY() AS id
      `);
    milestoneId = insertM.recordset[0].id;
  }

  // Find existing submission for this milestone that we use as anchor
  const sRes2 = await pool
    .request()
    .input("milestoneId", sql.Int, milestoneId)
    .query("SELECT id FROM Submissions WHERE milestone_id = @milestoneId AND note = 'FORUM_ANCHOR'");

  if (sRes2.recordset.length > 0) {
    return sRes2.recordset[0].id;
  }

  // Create a submission with student_id = lecturer_id to satisfy NOT NULL constraints
  const tRes2 = await pool.request().input("thesisId", sql.Int, thesisId).query("SELECT lecturer_id FROM Thesis WHERE id = @thesisId");
  const studentId = tRes2.recordset[0].lecturer_id;

  const insertS = await pool
    .request()
    .input("milestoneId", sql.Int, milestoneId)
    .input("thesisId", sql.Int, thesisId)
    .input("studentId", sql.Int, studentId)
    .input("now", sql.DateTime, now)
    .query(`
      INSERT INTO Submissions (milestone_id, thesis_id, student_id, file_url, file_name, file_size, note, status, submitted_at)
      VALUES (@milestoneId, @thesisId, @studentId, '#', 'forum', 0, 'FORUM_ANCHOR', 'submitted', @now);
      SELECT SCOPE_IDENTITY() AS id
    `);

  return insertS.recordset[0].id;
}

// GET anchor submission id for a class (creates anchor if missing)
exports.getClassAnchor = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || isNaN(classId)) return res.status(400).json({ message: "classId không hợp lệ" });

    // check membership similar to getCommentsByClass
    const pool = await poolPromise;
    const classCheck = await pool.request().input("classId", sql.Int, parseInt(classId)).query("SELECT id, lecturer_id FROM Classes WHERE id = @classId");
    if (classCheck.recordset.length === 0) return res.status(404).json({ message: "Lớp không tồn tại" });

    const { lecturer_id } = classCheck.recordset[0];
    let allowed = false;
    if (req.user.role === "admin") allowed = true;
    if (req.user.role === "lecturer" && lecturer_id === req.user.id) allowed = true;
    if (req.user.role === "student") {
      const membership = await pool.request().input("classId", sql.Int, parseInt(classId)).input("studentId", sql.Int, req.user.id).query("SELECT class_id FROM ClassStudents WHERE class_id = @classId AND student_id = @studentId");
      if (membership.recordset.length > 0) allowed = true;
    }
    if (!allowed) return res.status(403).json({ message: "Bạn không có quyền" });

    const submissionId = await ensureClassForumSubmission(parseInt(classId));
    res.json({ submissionId });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy anchor submission", error: err.message });
  }
};

// POST /api/lecturer/comments/class/:classId -> create comment on anchor submission
exports.createCommentForClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { content } = req.body;
    if (!classId || isNaN(classId)) return res.status(400).json({ message: "classId không hợp lệ" });
    if (!content || content.trim().length === 0) return res.status(400).json({ message: "Nội dung comment không được rỗng" });

    // ensure membership: students must belong to class, lecturers must be lecturer
    const pool = await poolPromise;
    const classCheck = await pool.request().input("classId", sql.Int, parseInt(classId)).query("SELECT id, lecturer_id FROM Classes WHERE id = @classId");
    if (classCheck.recordset.length === 0) return res.status(404).json({ message: "Lớp không tồn tại" });
    const { lecturer_id } = classCheck.recordset[0];
    let allowed = false;
    if (req.user.role === "admin") allowed = true;
    if (req.user.role === "lecturer" && lecturer_id === req.user.id) allowed = true;
    if (req.user.role === "student") {
      const membership = await pool.request().input("classId", sql.Int, parseInt(classId)).input("studentId", sql.Int, req.user.id).query("SELECT class_id FROM ClassStudents WHERE class_id = @classId AND student_id = @studentId");
      if (membership.recordset.length > 0) allowed = true;
    }
    if (!allowed) return res.status(403).json({ message: "Bạn không có quyền bình luận ở lớp này" });

    const submissionId = await ensureClassForumSubmission(parseInt(classId));

    const comment = await commentService.createComment({ submissionId, userId: req.user.id, content: content.trim() });
    res.status(201).json({ message: "Tạo comment thành công", data: comment });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo comment class", error: err.message });
  }
};

/**
 * GET /api/lecturer/comments/:id
 * Get a single comment by ID
 */
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Comment ID không hợp lệ" });
    }

    const comment = await commentService.getCommentById(parseInt(id));
    if (!comment) {
      return res.status(404).json({ message: "Comment không tồn tại" });
    }

    // Verify lecturer access - check if comment belongs to their thesis
    const pool = await poolPromise;
    const accessCheck = await pool
      .request()
      .input("commentId", sql.Int, parseInt(id))
      .query(`
        SELECT t.lecturer_id
        FROM Comments c
        JOIN Submissions s ON s.id = c.submission_id
        JOIN Thesis t ON t.id = s.thesis_id
        WHERE c.id = @commentId
      `);

    if (accessCheck.recordset.length === 0 || accessCheck.recordset[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem comment này" });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy comment", error: err.message });
  }
};

/**
 * POST /api/lecturer/comments/submission/:submissionId
 * Create a new comment on a submission
 */
exports.createComment = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { content } = req.body;

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ message: "submissionId không hợp lệ" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Nội dung comment không được rỗng" });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({ message: "Nội dung comment không được vượt quá 5000 ký tự" });
    }

    // Verify submission exists
    const pool = await poolPromise;
    const submissionCheck = await pool
      .request()
      .input("submissionId", sql.Int, parseInt(submissionId))
      .query(`
        SELECT s.id, s.thesis_id, t.lecturer_id
        FROM Submissions s
        JOIN Thesis t ON t.id = s.thesis_id
        WHERE s.id = @submissionId
      `);

    if (submissionCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Submission không tồn tại" });
    }

    const { lecturer_id, thesis_id } = submissionCheck.recordset[0];

    // If user is not the lecturer of the thesis, allow posting only when this submission
    // belongs to a class forum anchor and user is a member of that class (or admin).
    if (lecturer_id !== req.user.id) {
      // check if thesis is an anchor
      const th = await pool
        .request()
        .input("thesisId", sql.Int, thesis_id)
        .query("SELECT id, title, class_id FROM Thesis WHERE id = @thesisId");

      if (th.recordset.length === 0) return res.status(403).json({ message: "Bạn không có quyền comment trên submission này" });

      const { title, class_id } = th.recordset[0];
      if (!title || !title.startsWith("DIEN_DAN_CHUNG_LOP_")) {
        return res.status(403).json({ message: "Bạn không có quyền comment trên submission này" });
      }

      // allow if admin
      if (req.user.role === "admin") {
        // allowed
      } else if (req.user.role === "student") {
        const membership = await pool
          .request()
          .input("classId", sql.Int, class_id)
          .input("studentId", sql.Int, req.user.id)
          .query("SELECT class_id FROM ClassStudents WHERE class_id = @classId AND student_id = @studentId");
        if (membership.recordset.length === 0) return res.status(403).json({ message: "Bạn không có quyền comment trên submission này" });
      } else {
        return res.status(403).json({ message: "Bạn không có quyền comment trên submission này" });
      }
    }

    const comment = await commentService.createComment({
      submissionId: parseInt(submissionId),
      userId: req.user.id,
      content: content.trim()
    });

    res.status(201).json({
      message: "Tạo comment thành công!",
      data: comment
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo comment", error: err.message });
  }
};

/**
 * PUT /api/lecturer/comments/:id
 * Update a comment
 */
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Comment ID không hợp lệ" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Nội dung comment không được rỗng" });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({ message: "Nội dung comment không được vượt quá 5000 ký tự" });
    }

    // Verify comment exists and user is the owner
    const pool = await poolPromise;
    const commentCheck = await pool
      .request()
      .input("commentId", sql.Int, parseInt(id))
      .query(`
        SELECT c.id, c.user_id, t.lecturer_id, t.title as thesis_title
        FROM Comments c
        JOIN Submissions s ON s.id = c.submission_id
        JOIN Thesis t ON t.id = s.thesis_id
        WHERE c.id = @commentId
      `);

    if (commentCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Comment không tồn tại" });
    }

    const { user_id, lecturer_id } = commentCheck.recordset[0];
    
    // Only the comment owner or the lecturer can update
    if (user_id !== req.user.id && lecturer_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật comment này" });
    }

    const comment = await commentService.updateComment(parseInt(id), {
      content: content.trim()
    });

    res.json({
      message: "Cập nhật comment thành công!",
      data: comment
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật comment", error: err.message });
  }
};

/**
 * DELETE /api/lecturer/comments/:id
 * Delete a comment
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Comment ID không hợp lệ" });
    }

    // Verify comment exists and user is the owner or lecturer
    const pool = await poolPromise;
    const commentCheck = await pool
      .request()
      .input("commentId", sql.Int, parseInt(id))
      .query(`
        SELECT c.id, c.user_id, t.lecturer_id
        FROM Comments c
        JOIN Submissions s ON s.id = c.submission_id
        JOIN Thesis t ON t.id = s.thesis_id
        WHERE c.id = @commentId
      `);

    if (commentCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Comment không tồn tại" });
    }

    const { user_id, lecturer_id, thesis_title } = commentCheck.recordset[0];

    // If this comment belongs to a forum anchor (thesis title starts with marker),
    // only the lecturer/admin can delete — students (even owners) cannot delete.
    if (thesis_title && thesis_title.startsWith("DIEN_DAN_CHUNG_LOP_")) {
      if (req.user.role !== "admin" && lecturer_id !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền xóa comment này" });
      }
    } else {
      // Only the comment owner or the lecturer can delete
      if (user_id !== req.user.id && lecturer_id !== req.user.id) {
        return res.status(403).json({ message: "Bạn không có quyền xóa comment này" });
      }
    }

    await commentService.deleteComment(parseInt(id));

    res.json({ message: "Xóa comment thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa comment", error: err.message });
  }
};

/**
 * GET /api/lecturer/students-with-thesis/:classId
 * Get all students of a class with their thesis topics and latest submission
 */
exports.getStudentsWithThesis = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!classId || isNaN(classId)) {
      return res.status(400).json({ message: "classId không hợp lệ" });
    }

    // Verify class exists and user is the lecturer
    const pool = await poolPromise;
    const classCheck = await pool
      .request()
      .input("classId", sql.Int, parseInt(classId))
      .query("SELECT id, lecturer_id FROM Classes WHERE id = @classId");

    if (classCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Lớp không tồn tại" });
    }

    const { lecturer_id } = classCheck.recordset[0];
    if (lecturer_id !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền xem danh sách sinh viên của lớp này" });
    }

    // Get all students in this class with their thesis information
    const result = await pool
      .request()
      .input("classId", sql.Int, parseInt(classId))
      .query(`
        SELECT DISTINCT
          u.id as student_id,
          u.name as student_name,
          u.email as student_email,
          t.id as thesis_id,
          t.title as thesis_title,
          t.description as thesis_description,
          MAX(s.id) as latest_submission_id,
          MAX(s.submitted_at) as latest_submission_date
        FROM ClassStudents cs
        JOIN Users u ON u.id = cs.student_id
        LEFT JOIN Thesis t ON t.student_id = u.id
        LEFT JOIN Submissions s ON s.thesis_id = t.id AND s.note NOT IN ('FORUM_ANCHOR')
        WHERE cs.class_id = @classId
        GROUP BY 
          u.id,
          u.name,
          u.email,
          t.id,
          t.title,
          t.description
        ORDER BY u.name ASC
      `);

    res.json({ data: result.recordset, total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách sinh viên", error: err.message });
  }
};
