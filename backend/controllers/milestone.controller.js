const milestoneService = require("../services/milestone.service");

exports.getMilestones = async (req, res) => {
  const { thesis_id } = req.query;
  console.log("getMilestones called, thesis_id:", thesis_id);

  try {
    let milestones;
    if (thesis_id) {
      milestones = await milestoneService.getMilestonesByThesis(parseInt(thesis_id));
    } else {
      // Nếu không có thesis_id, trả về tất cả milestones
      milestones = await milestoneService.getAllMilestones();
    }
    res.json({ data: milestones, total: milestones.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách milestone", error: err.message });
  }
};

exports.getMilestoneById = async (req, res) => {
  try {
    const milestone = await milestoneService.getMilestoneById(parseInt(req.params.id));
    if (!milestone) {
      return res.status(404).json({ message: "Không tìm thấy milestone" });
    }
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy milestone", error: err.message });
  }
};

exports.createMilestone = async (req, res) => {
  const { thesisId, title, description, deadline, status } = req.body;

  if (!thesisId || !title) {
    return res.status(400).json({ message: "thesisId và title là bắt buộc" });
  }

  try {
    const milestone = await milestoneService.createMilestone({
      thesisId:    parseInt(thesisId),
      createdBy:   req.user.id,          // lấy từ JWT token (authMiddleware gán vào req.user)
      title,
      description,
      deadline,
      status,
    });
    res.status(201).json({ message: "Tạo milestone thành công!", data: milestone });
  } catch (err) {
    const status = err.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ message: err.message, error: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  const { title, description, deadline, status } = req.body;

  try {
    const updated = await milestoneService.updateMilestone(
      parseInt(req.params.id),
      { title, description, deadline, status }
    );
    res.json({ message: "Cập nhật milestone thành công!", data: updated });
  } catch (err) {
    const httpStatus = err.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(httpStatus).json({ message: err.message, error: err.message });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    await milestoneService.deleteMilestone(parseInt(req.params.id));
    res.json({ message: "Xóa milestone thành công!" });
  } catch (err) {
    const httpStatus = err.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(httpStatus).json({ message: err.message, error: err.message });
  }
};