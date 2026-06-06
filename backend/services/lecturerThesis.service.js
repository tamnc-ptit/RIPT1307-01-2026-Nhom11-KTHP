const { poolPromise, sql } = require("../config/db");

exports.verifyThesisOwnership = async (thesisId, lecturerId) => {
  const pool = await poolPromise;
  const res = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT id FROM Thesis WHERE id = @thesisId AND lecturer_id = @lecturerId");

  return res.recordset.length > 0;
};

exports.getThesisNotificationInfo = async (thesisId) => {
  const pool = await poolPromise;
  const res = await pool
    .request()
    .input("id", sql.Int, thesisId)
    .query("SELECT student_id, title FROM Thesis WHERE id = @id");
  return res.recordset[0] || null;
};

exports.getMilestoneNotificationInfo = async (milestoneId) => {
  const pool = await poolPromise;
  const res = await pool
    .request()
    .input("id", sql.Int, milestoneId)
    .query(`
      SELECT m.thesis_id, m.title AS milestone_title, t.student_id, t.title AS thesis_title
      FROM Milestones m
      JOIN Thesis t ON m.thesis_id = t.id
      WHERE m.id = @id
    `);
  return res.recordset[0] || null;
};

exports.approveThesis = async (thesisId, lecturerNote) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const requestUpdate = new sql.Request(transaction);
    await requestUpdate
      .input("thesisId", sql.Int, thesisId)
      .input("lecturerNote", sql.NVarChar, lecturerNote || null)
      .query("UPDATE Thesis SET lecturer_status = 'approved', lecturer_note = @lecturerNote, approved_at = GETDATE(), updated_at = GETDATE() WHERE id = @thesisId");
      
    const requestGet = new sql.Request(transaction);
    const getRes = await requestGet
      .input("thesisId", sql.Int, thesisId)
      .query("SELECT class_id, lecturer_id FROM Thesis WHERE id = @thesisId");
    
    if (getRes.recordset[0]) {
      const { class_id, lecturer_id } = getRes.recordset[0];
      
      if (class_id) {
        const requestInsert = new sql.Request(transaction);
        await requestInsert
          .input("thesisId", sql.Int, thesisId)
          .input("lecturerId", sql.Int, lecturer_id)
          .input("classId", sql.Int, class_id)
          .query(`
            INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status, created_at)
            SELECT @thesisId, @lecturerId, title, description, deadline, 'pending', GETDATE()
            FROM MilestoneTemplates
            WHERE class_id = @classId
          `);
      }
    }
    
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

exports.rejectThesis = async (thesisId, rejectReason) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, thesisId)
    .input("reason", sql.NVarChar, rejectReason)
    .query("UPDATE Thesis SET lecturer_status = 'rejected', reject_reason = @reason, updated_at = GETDATE() WHERE id = @id");
  return { success: true };
};

exports.finalizeThesis = async (thesisId, finalScore) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, thesisId)
    .input("finalScore", sql.Float, finalScore)
    .query(`
      UPDATE Thesis 
      SET 
        final_score = @finalScore,
        status = 'completed',
        lecturer_status = 'approved',
        admin_status = 'approved',
        updated_at = GETDATE()
      WHERE id = @id
    `);
  return { success: true };
};

exports.getThesisDetail = async (thesisId, lecturerId) => {
  const pool = await poolPromise;

  const ownerRes = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT id FROM Thesis WHERE id = @thesisId AND lecturer_id = @lecturerId");

  if (ownerRes.recordset.length === 0) {
    throw new Error("Bạn không có quyền xem đề tài này");
  }

  const thesisRes = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
        t.*,
        u.name AS studentName,
        u.email AS studentEmail,
        c.class_name,
        s.name AS session_name
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      LEFT JOIN Classes c ON t.class_id = c.id
      LEFT JOIN Sessions s ON t.session_id = s.id
      WHERE t.id = @thesisId
    `);

  const thesis = thesisRes.recordset[0];

  const milestonesRes = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.deadline,
        m.status,
        m.created_at,
        s.id AS submission_id,
        s.file_url,
        s.file_name,
        s.submitted_at,
        s.score AS submission_score,
        s.status AS submission_status,
        s.note AS submission_note
      FROM Milestones m
      LEFT JOIN Submissions s ON s.milestone_id = m.id AND s.thesis_id = m.thesis_id
      WHERE m.thesis_id = @thesisId
      ORDER BY m.deadline ASC
    `);

  const commentsRes = await pool
    .request()
    .input("thesisId", sql.Int, thesisId)
    .query(`
      SELECT 
        c.id,
        c.submission_id,
        c.content,
        c.created_at,
        u.name AS commenter_name,
        u.role AS commenter_role
      FROM Comments c
      JOIN Submissions sub ON c.submission_id = sub.id
      JOIN Users u ON c.user_id = u.id
      WHERE sub.thesis_id = @thesisId
      ORDER BY c.created_at DESC
    `);

  const commentsBySubmission = {};
  commentsRes.recordset.forEach((comment) => {
    if (!commentsBySubmission[comment.submission_id]) {
      commentsBySubmission[comment.submission_id] = [];
    }
    commentsBySubmission[comment.submission_id].push(comment);
  });

  const milestonesWithData = milestonesRes.recordset.map((m) => ({
    ...m,
    comments: m.submission_id ? (commentsBySubmission[m.submission_id] || []) : []
  }));

  return {
    thesis,
    milestones: milestonesWithData
  };
};

exports.getLecturerTheses = async (params) => {
  const { lecturerId, keyword, status, class_id, session_id, page = 1, pageSize = 10 } = params;
  const pool = await poolPromise;

  const offset = (page - 1) * pageSize;

  let whereClause = `t.lecturer_id = @lecturerId
    AND t.student_id IS NOT NULL
    AND (t.status IS NULL OR t.status <> 'forum')
    AND t.title NOT LIKE 'DIEN_DAN_CHUNG_LOP_%'`;
  const request = pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .input("keyword", sql.NVarChar, keyword || null)
    .input("status", sql.NVarChar, status || null)
    .input("classId", sql.Int, class_id || null)
    .input("sessionId", sql.Int, session_id || null)
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize);

  if (keyword) {
    whereClause += ` AND t.title LIKE '%' + @keyword + '%'`;
  }

  if (status) {
    whereClause += ` AND (
      (@status = 'Pending' AND t.lecturer_status = 'pending') OR
      (@status = 'Approved' AND t.lecturer_status = 'approved' AND t.final_score IS NULL) OR
      (@status = 'Completed' AND t.final_score IS NOT NULL) OR
      (@status = 'Rejected' AND (t.lecturer_status = 'rejected' OR t.admin_status = 'rejected'))
    )`;
  }

  if (class_id) {
    whereClause += ` AND t.class_id = @classId`;
  }
  if (session_id) {
    whereClause += ` AND t.session_id = @sessionId`;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM Thesis t
    WHERE ${whereClause}
  `;

  const dataQuery = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.class_id,
      t.lecturer_status,
      t.admin_status,
      t.final_score,
      t.lecturer_note,
      t.created_at,
      t.updated_at,
      u.name AS studentName,
      c.class_name,
      s.name AS session_name,
      (SELECT COUNT(*) FROM Milestones m WHERE m.thesis_id = t.id) AS total_milestones,
      (SELECT COUNT(*) FROM Milestones m WHERE m.thesis_id = t.id AND m.status = 'completed') AS completed_milestones
    FROM Thesis t
    LEFT JOIN Users u ON t.student_id = u.id
    LEFT JOIN Classes c ON t.class_id = c.id
    LEFT JOIN Sessions s ON t.session_id = s.id
    WHERE ${whereClause}
    ORDER BY t.updated_at DESC
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `;

  const [countRes, dataRes] = await Promise.all([
    request.query(countQuery),
    request.query(dataQuery)
  ]);

  const total = countRes.recordset[0].total;
  const items = dataRes.recordset.map(row => {
    let displayStatus = 'Pending';
    if (row.lecturer_status === 'rejected' || row.admin_status === 'rejected') displayStatus = 'Rejected';
    else if (row.final_score !== null) displayStatus = 'Completed';
    else if (row.lecturer_status === 'approved') displayStatus = 'Approved';

    let finalScore = row.final_score ?? null;
    if (finalScore === null && row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
      finalScore = parseFloat(row.lecturer_note.split("=")[1]);
    }

    return {
      ...row,
      status: displayStatus,
      final_score: finalScore,
      finalScore: finalScore,
      progress: row.total_milestones > 0 
        ? Math.round((row.completed_milestones / row.total_milestones) * 100) 
        : 0
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};
