const proposalService = require("../services/proposal.service");
const lecturerService = require("../services/lecturer.service"); // only for logAudit (shared helper)

// ==================== PROPOSALS (TopicSuggestions) - Management by Lecturer ====================

exports.getMyProposals = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "lecturer") {
      return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
    }
    const lecturerId = req.user.id;
    const data = await proposalService.getMyProposals(lecturerId);
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
    const data = await proposalService.createProposal(payload);

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
    const data = await proposalService.updateProposal(id, req.body, lecturerId);

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
    await proposalService.deleteProposal(id, lecturerId);

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
