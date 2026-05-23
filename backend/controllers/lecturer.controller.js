const lecturerService = require("../services/lecturer.service");
const { poolPromise, sql } = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  // Permission: Chỉ cho phép lecturer xem dashboard của chính mình
  if (!req.user || req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
  }
  const lecturerId = req.user.id;   // Luôn dùng id từ token, bỏ qua query param

  try {
    const stats = await lecturerService.getDashboardStats(lecturerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getRiskFlags = async (req, res) => {
  // Permission: Chỉ cho phép lecturer xem rủi ro của chính mình
  if (!req.user || req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
  }
  const lecturerId = req.user.id;

  try {
    const risks = await lecturerService.getRiskFlags(lecturerId);
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getClasses = async (req, res) => {
  let { lecturerId } = req.query;
  if (req.user && req.user.role === "lecturer") {
    lecturerId = req.user.id;
  }
  if (!lecturerId) return res.status(400).json({ message: "Thiếu lecturerId" });

  try {
    const classes = await lecturerService.getClasses(lecturerId);
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.approveThesis = async (req, res) => {
  const { id } = req.params;
  const lecturerId = req.user?.id;

  // Permission check: chỉ được duyệt thesis của chính mình
  const isOwner = await lecturerService.verifyThesisOwnership(id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền duyệt đề tài này" });
  }

  try {
    const result = await lecturerService.approveThesis(id);

    // Gửi thông báo cho sinh viên
    const pool = await poolPromise;
    const thesisInfo = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT student_id, title FROM Thesis WHERE id = @id");

    if (thesisInfo.recordset[0]) {
      const { student_id, title } = thesisInfo.recordset[0];
      await lecturerService.createNotification({
        user_id: student_id,
        type: "thesis_approved",
        title: "Đề tài đã được duyệt",
        message: `Đề tài "${title}" đã được Giảng viên duyệt. Vui lòng chuẩn bị nộp tiến độ theo quy trình.`,
        ref_type: "thesis",
        ref_id: parseInt(id)
      });

      // Audit log
      await lecturerService.logAudit({
        actor_id: lecturerId,
        actor_name: req.user?.name || req.user?.email,
        action: "APPROVE",
        target_table: "Thesis",
        target_id: parseInt(id),
        new_value: { lecturer_status: "approved" }
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi duyệt đề tài", error: err.message });
  }
};

exports.rejectThesis = async (req, res) => {
  const { id } = req.params;
  const { rejectReason } = req.body;
  const lecturerId = req.user?.id;

  if (!rejectReason) return res.status(400).json({ message: "Cần nhập lý do từ chối" });

  // Permission check
  const isOwner = await lecturerService.verifyThesisOwnership(id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền từ chối đề tài này" });
  }

  try {
    const result = await lecturerService.rejectThesis(id, rejectReason);

    // Gửi thông báo từ chối
    const pool = await poolPromise;
    const thesisInfo = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT student_id, title FROM Thesis WHERE id = @id");

    if (thesisInfo.recordset[0]) {
      const { student_id, title } = thesisInfo.recordset[0];
      await lecturerService.createNotification({
        user_id: student_id,
        type: "thesis_rejected",
        title: "Đề tài bị từ chối",
        message: `Đề tài "${title}" đã bị Giảng viên từ chối. Lý do: ${rejectReason}`,
        ref_type: "thesis",
        ref_id: parseInt(id)
      });

      // Audit log
      await lecturerService.logAudit({
        actor_id: lecturerId,
        actor_name: req.user?.name || req.user?.email,
        action: "REJECT",
        target_table: "Thesis",
        target_id: parseInt(id),
        new_value: { lecturer_status: "rejected", reject_reason: rejectReason }
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi từ chối đề tài", error: err.message });
  }
};

const milestoneService = require("../services/milestone.service");

exports.getMilestones = async (req, res) => {
  const { thesisId } = req.query;
  if (!thesisId) return res.status(400).json({ message: "Thiếu thesisId" });

  try {
    const milestones = await milestoneService.getMilestonesByThesis(thesisId);
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.updateMilestoneFeedback = async (req, res) => {
  const { id } = req.params;
  const lecturerId = req.user?.id;

  // Permission: chỉ được chấm milestone của thesis mình hướng dẫn
  const isOwner = await lecturerService.verifyMilestoneOwnership(id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền chấm mốc này" });
  }

  try {
    const result = await milestoneService.updateMilestoneFeedback(id, req.body);

    // Gửi thông báo chấm điểm
    const pool = await poolPromise;
    const milestoneInfo = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT m.thesis_id, m.title, t.student_id, t.title AS thesis_title
        FROM Milestones m
        JOIN Thesis t ON m.thesis_id = t.id
        WHERE m.id = @id
      `);

    if (milestoneInfo.recordset[0]) {
      const { student_id, title, thesis_title } = milestoneInfo.recordset[0];
      const scoreText = req.body.score ? ` - Điểm: ${req.body.score}` : "";
      await lecturerService.createNotification({
        user_id: student_id,
        type: "submission_graded",
        title: "Bài nộp đã được chấm",
        message: `Mốc "${title}" của đề tài "${thesis_title}" đã được Giảng viên chấm điểm${scoreText}.`,
        ref_type: "milestone",
        ref_id: parseInt(id)
      });

      // Audit log
      await lecturerService.logAudit({
        actor_id: lecturerId,
        actor_name: req.user?.name || req.user?.email,
        action: "GRADE",
        target_table: "Milestones",
        target_id: parseInt(id),
        new_value: { score: req.body.score, comment: req.body.comment, status: req.body.status }
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật phản hồi", error: err.message });
  }
};

exports.finalizeThesis = async (req, res) => {
  const { id } = req.params;
  const { finalScore } = req.body;
  const lecturerId = req.user?.id;

  if (finalScore === undefined) return res.status(400).json({ message: "Thiếu điểm tổng kết" });

  // Permission check
  const isOwner = await lecturerService.verifyThesisOwnership(id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền kết thúc đề tài này" });
  }

  try {
    const result = await lecturerService.finalizeThesis(id, finalScore);

    // Gửi thông báo hoàn thành đề tài
    const pool = await poolPromise;
    const thesisInfo = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT student_id, title FROM Thesis WHERE id = @id");

    if (thesisInfo.recordset[0]) {
      const { student_id, title } = thesisInfo.recordset[0];
      await lecturerService.createNotification({
        user_id: student_id,
        type: "thesis_finalized",
        title: "Đồ án đã hoàn thành",
        message: `Đề tài "${title}" đã được Giảng viên kết thúc và chấm điểm tổng kết: ${finalScore}.`,
        ref_type: "thesis",
        ref_id: parseInt(id)
      });

      // Audit log
      await lecturerService.logAudit({
        actor_id: lecturerId,
        actor_name: req.user?.name || req.user?.email,
        action: "FINALIZE",
        target_table: "Thesis",
        target_id: parseInt(id),
        new_value: { final_score: finalScore, status: "completed" }
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi kết thúc đề tài", error: err.message });
  }
};

exports.exportReport = async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: "Thiếu classId" });

  try {
    if (req.user && req.user.role === "lecturer") {
      const classes = await lecturerService.getClasses(req.user.id);
      const isOwner = classes.some(c => c.id == classId);
      if (!isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xuất báo cáo lớp học này!" });
      }
    }
    const { workbook, className } = await lecturerService.exportClassReport(classId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(className)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xuất báo cáo", error: err.message });
  }
};

// --- Sessions ---
exports.getSessions = async (req, res) => {
  try {
    let { lecturerId } = req.query;
    if (req.user && req.user.role === "lecturer") {
      lecturerId = req.user.id;
    }
    const data = await lecturerService.getSessions(lecturerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy Sessions", error: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const data = await lecturerService.createSession(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Session", error: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await lecturerService.deleteSession(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa Session", error: err.message });
  }
};

// --- Templates ---
exports.getTemplates = async (req, res) => {
  try {
    const { classId } = req.query;
    if (classId && req.user && req.user.role === "lecturer") {
      const classes = await lecturerService.getClasses(req.user.id);
      const isOwner = classes.some(c => c.id == classId);
      if (!isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xem quy trình mẫu của lớp này!" });
      }
    }
    const data = await lecturerService.getTemplates(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy Templates", error: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const data = await lecturerService.createTemplate(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Template", error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await lecturerService.updateTemplate(id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật Template", error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await lecturerService.deleteTemplate(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa Template", error: err.message });
  }
};

// --- Lecturer Proposals (My Proposals) ---
exports.getMyProposals = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }
    const lecturerId = req.user.id;
    const data = await lecturerService.getMyProposals(lecturerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đề xuất", error: err.message });
  }
};

exports.createProposal = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }
    const payload = {
      ...req.body,
      lecturer_id: req.user.id
    };
    const data = await lecturerService.createProposal(payload);

    // Audit log
    await lecturerService.logAudit({
      actor_id: req.user.id,
      actor_name: req.user?.name || req.user?.email,
      action: "CREATE_PROPOSAL",
      target_table: "TopicSuggestions",
      target_id: data?.id,
      new_value: payload
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo đề xuất", error: err.message });
  }
};

exports.updateProposal = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }
    const { id } = req.params;
    const lecturerId = req.user.id;
    const data = await lecturerService.updateProposal(id, req.body, lecturerId);

    // Audit log
    await lecturerService.logAudit({
      actor_id: lecturerId,
      actor_name: req.user?.name || req.user?.email,
      action: "UPDATE_PROPOSAL",
      target_table: "TopicSuggestions",
      target_id: parseInt(id),
      new_value: req.body
    });

    res.json(data);
  } catch (err) {
    res.status(403).json({ message: err.message || "Lỗi cập nhật đề xuất" });
  }
};

exports.deleteProposal = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }
    const { id } = req.params;
    const lecturerId = req.user.id;
    await lecturerService.deleteProposal(id, lecturerId);

    // Audit log
    await lecturerService.logAudit({
      actor_id: lecturerId,
      actor_name: req.user?.name || req.user?.email,
      action: "DELETE_PROPOSAL",
      target_table: "TopicSuggestions",
      target_id: parseInt(id)
    });

    res.json({ success: true });
  } catch (err) {
    res.status(403).json({ message: err.message || "Lỗi xóa đề xuất" });
  }
};

// --- Thesis Detail ---
exports.getThesisDetail = async (req, res) => {
  const { id } = req.params;
  const lecturerId = req.user?.id;

  try {
    const data = await lecturerService.getThesisDetail(id, lecturerId);
    res.json(data);
  } catch (err) {
    res.status(403).json({ message: err.message || "Lỗi khi lấy chi tiết đề tài" });
  }
};

// --- Custom Milestones ---
exports.createMilestone = async (req, res) => {
  const { thesis_id } = req.body;
  const lecturerId = req.user?.id;

  if (!thesis_id) {
    return res.status(400).json({ message: "Thiếu thesis_id" });
  }

  // Permission: chỉ được tạo milestone cho thesis của mình
  const isOwner = await lecturerService.verifyThesisOwnership(thesis_id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền thêm mốc cho đề tài này" });
  }

  try {
    const data = await lecturerService.createMilestone(req.body);

    // Audit log
    await lecturerService.logAudit({
      actor_id: lecturerId,
      actor_name: req.user?.name || req.user?.email,
      action: "CREATE_MILESTONE",
      target_table: "Milestones",
      target_id: data?.id,
      new_value: req.body
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Milestone", error: err.message });
  }
};

exports.getClassStudents = async (req, res) => {
  const { classId } = req.params;
  try {
    if (req.user && req.user.role === "lecturer") {
      const classes = await lecturerService.getClasses(req.user.id);
      const isOwner = classes.some(c => c.id == classId);
      if (!isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xem danh sách sinh viên lớp này!" });
      }
    }
    const data = await lecturerService.getClassStudents(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

// Dedicated endpoint for lecturer's thesis list with advanced filters
exports.getLecturerTheses = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }

    const lecturerId = req.user.id;
    const { keyword, status, class_id, session_id, page = 1, pageSize = 10 } = req.query;

    const data = await lecturerService.getLecturerTheses({
      lecturerId,
      keyword,
      status,
      class_id: class_id ? parseInt(class_id) : null,
      session_id: session_id ? parseInt(session_id) : null,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đề tài", error: err.message });
  }
};

// Bulk approve multiple theses
exports.bulkApproveTheses = async (req, res) => {
  const { thesisIds } = req.body;
  const lecturerId = req.user?.id;

  if (!Array.isArray(thesisIds) || thesisIds.length === 0) {
    return res.status(400).json({ message: "Danh sách đề tài không hợp lệ" });
  }

  try {
    const results = [];
    for (const id of thesisIds) {
      const isOwner = await lecturerService.verifyThesisOwnership(id, lecturerId);
      if (isOwner) {
        await lecturerService.approveThesis(id);
        // Send notification (reuse existing logic)
        const pool = await poolPromise;
        const info = await pool.request().input("id", sql.Int, id).query("SELECT student_id, title FROM Thesis WHERE id = @id");
        if (info.recordset[0]) {
          const { student_id, title } = info.recordset[0];
          await lecturerService.createNotification({
            user_id: student_id,
            type: "thesis_approved",
            title: "Đề tài đã được duyệt",
            message: `Đề tài "${title}" đã được duyệt (bulk action).`,
            ref_type: "thesis",
            ref_id: id
          });
        }
        await lecturerService.logAudit({
          actor_id: lecturerId,
          actor_name: req.user?.name || req.user?.email,
          action: "BULK_APPROVE",
          target_table: "Thesis",
          target_id: id
        });
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, error: "Không có quyền" });
      }
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Lỗi bulk approve", error: err.message });
  }
};

// Bulk reject
exports.bulkRejectTheses = async (req, res) => {
  const { thesisIds, rejectReason } = req.body;
  const lecturerId = req.user?.id;

  if (!Array.isArray(thesisIds) || thesisIds.length === 0) {
    return res.status(400).json({ message: "Danh sách đề tài không hợp lệ" });
  }
  if (!rejectReason) {
    return res.status(400).json({ message: "Cần lý do từ chối" });
  }

  try {
    const results = [];
    for (const id of thesisIds) {
      const isOwner = await lecturerService.verifyThesisOwnership(id, lecturerId);
      if (isOwner) {
        await lecturerService.rejectThesis(id, rejectReason);
        const pool = await poolPromise;
        const info = await pool.request().input("id", sql.Int, id).query("SELECT student_id, title FROM Thesis WHERE id = @id");
        if (info.recordset[0]) {
          const { student_id, title } = info.recordset[0];
          await lecturerService.createNotification({
            user_id: student_id,
            type: "thesis_rejected",
            title: "Đề tài bị từ chối",
            message: `Đề tài "${title}" đã bị từ chối (bulk). Lý do: ${rejectReason}`,
            ref_type: "thesis",
            ref_id: id
          });
        }
        await lecturerService.logAudit({
          actor_id: lecturerId,
          actor_name: req.user?.name || req.user?.email,
          action: "BULK_REJECT",
          target_table: "Thesis",
          target_id: id,
          new_value: { reject_reason: rejectReason }
        });
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, error: "Không có quyền" });
      }
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Lỗi bulk reject", error: err.message });
  }
};
