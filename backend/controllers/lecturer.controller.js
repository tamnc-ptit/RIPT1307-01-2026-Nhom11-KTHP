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
