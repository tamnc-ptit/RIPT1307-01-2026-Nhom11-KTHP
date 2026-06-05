const lecturerService = require("../services/lecturer.service");
const lecturerThesisService = require("../services/lecturerThesis.service");
const notificationService = require("../services/notification.service");
const auditService = require("../services/audit.service");
const { poolPromise, sql } = require("../config/db");
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

    const milestoneInfo = await lecturerThesisService.getMilestoneNotificationInfo(id);
    if (milestoneInfo) {
      const { student_id, milestone_title, thesis_title } = milestoneInfo;
      const scoreText = req.body.score ? ` - Điểm: ${req.body.score}` : "";
      await notificationService.createNotification({
        user_id: student_id,
        type: "submission_graded",
        title: "Bài nộp đã được chấm",
        message: `Mốc "${milestone_title}" của đề tài "${thesis_title}" đã được Giảng viên chấm điểm${scoreText}.`,
        ref_type: "milestone",
        ref_id: parseInt(id)
      });

      await auditService.logAction({
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

exports.getSessions = async (req, res) => {
  const lecturerId = req.user?.id;
  if (!lecturerId) {
    return res.status(400).json({ message: "Thiếu lecturerId hoặc bạn chưa đăng nhập" });
  }
  try {
    const sessions = await lecturerService.getSessions(lecturerId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.createSession = async (req, res) => {
  const lecturerId = req.user?.id;
  if (!lecturerId) {
    return res.status(400).json({ message: "Thiếu thông tin người dùng" });
  }
  try {
    const data = {
      ...req.body,
      created_by: lecturerId
    };
    const session = await lecturerService.createSession(data);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await lecturerService.deleteSession(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const profile = await lecturerService.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy thông tin giảng viên" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server khi tải hồ sơ", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const { phone, degree, domain } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("phone", sql.NVarChar, phone || null)
      .input("degree", sql.NVarChar, degree || null)
      .input("domain", sql.NVarChar, domain || null)
      .query(`
        UPDATE Users 
        SET 
          phone = @phone, 
          degree = @degree, 
          domain = @domain, 
          updated_at = GETDATE() 
        WHERE id = @userId
      `);

    res.json({ message: "Cập nhật hồ sơ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server khi cập nhật hồ sơ", error: err.message });
  }
};


