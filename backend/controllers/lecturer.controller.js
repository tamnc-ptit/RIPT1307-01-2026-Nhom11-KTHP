const lecturerService = require("../services/lecturer.service");
const classController = require("./class.controller");
const classService = require("../services/class.service");
const lecturerThesisController = require("./lecturerThesis.controller");
const proposalController = require("./proposal.controller");
const templateController = require("./template.controller");
const { poolPromise, sql } = require("../config/db");

// Delegate sang class module (chỉ dành cho Lecturer)
exports.getClasses = classController.getLecturerClasses;

// Delegate sang lecturerThesis module
exports.approveThesis = lecturerThesisController.approveThesis;

// Delegate sang lecturerThesis module
exports.rejectThesis = lecturerThesisController.rejectThesis;

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

// Delegate sang lecturerThesis module
exports.finalizeThesis = lecturerThesisController.finalizeThesis;

exports.exportReport = async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: "Thiếu classId" });

  try {
    if (req.user && req.user.role === "lecturer") {
      const classes = await classService.getLecturerClasses(req.user.id);
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

// Delegate sang template module (common module)
exports.getTemplates = templateController.getTemplates;
exports.createTemplate = templateController.createTemplate;
exports.updateTemplate = templateController.updateTemplate;
exports.deleteTemplate = templateController.deleteTemplate;

// Delegate sang proposal module (common module)
exports.getMyProposals = proposalController.getMyProposals;
exports.createProposal = proposalController.createProposal;
exports.updateProposal = proposalController.updateProposal;
exports.deleteProposal = proposalController.deleteProposal;

// Delegate sang lecturerThesis module
exports.getThesisDetail = lecturerThesisController.getThesisDetail;
exports.createMilestone = lecturerThesisController.createMilestone;

// Delegate sang class module (chỉ dành cho Lecturer)
exports.getClassStudents = classController.getLecturerClassStudents;

// Delegate sang lecturerThesis module
exports.getLecturerTheses = lecturerThesisController.getLecturerTheses;
exports.bulkApproveTheses = lecturerThesisController.bulkApproveTheses;
exports.bulkRejectTheses = lecturerThesisController.bulkRejectTheses;
