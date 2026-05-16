const lecturerService = require("../services/lecturer.service");

exports.getDashboardStats = async (req, res) => {
  const { lecturerId } = req.query; // Tạm thời lấy qua query, sau này nên lấy từ token
  if (!lecturerId) return res.status(400).json({ message: "Thiếu lecturerId" });

  try {
    const stats = await lecturerService.getDashboardStats(lecturerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getRiskFlags = async (req, res) => {
  const { lecturerId } = req.query;
  if (!lecturerId) return res.status(400).json({ message: "Thiếu lecturerId" });

  try {
    const risks = await lecturerService.getRiskFlags(lecturerId);
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getClasses = async (req, res) => {
  const { lecturerId } = req.query;
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
  try {
    const result = await lecturerService.approveThesis(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi duyệt đề tài", error: err.message });
  }
};

exports.rejectThesis = async (req, res) => {
  const { id } = req.params;
  const { rejectReason } = req.body;
  if (!rejectReason) return res.status(400).json({ message: "Cần nhập lý do từ chối" });

  try {
    const result = await lecturerService.rejectThesis(id, rejectReason);
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
  try {
    const result = await milestoneService.updateMilestoneFeedback(id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật phản hồi", error: err.message });
  }
};

exports.finalizeThesis = async (req, res) => {
  const { id } = req.params;
  const { finalScore } = req.body;
  if (finalScore === undefined) return res.status(400).json({ message: "Thiếu điểm tổng kết" });

  try {
    const result = await lecturerService.finalizeThesis(id, finalScore);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi kết thúc đề tài", error: err.message });
  }
};

exports.exportReport = async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: "Thiếu classId" });

  try {
    const workbook = await lecturerService.exportClassReport(classId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=BaoCaoLop_${classId}.xlsx`
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
    const { lecturerId } = req.query;
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

// --- Custom Milestones ---
exports.createMilestone = async (req, res) => {
  try {
    const data = await lecturerService.createMilestone(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Milestone", error: err.message });
  }
};
