// backend/controllers/progress.controller.js
const progressService = require("../services/progress.service");

// --- PHẦN 1: CỘT MỐC (MILESTONES) ---
const getMilestones = async (req, res) => {
  try {
    const { thesisId } = req.params;
    const data = await progressService.getMilestonesByThesis(thesisId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy Milestones", error: err.message });
  }
};

const updateMilestone = async (req, res) => {
  try {
    await progressService.updateMilestoneStatus(req.params.id, req.body.status);
    res.json({ success: true, message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái", error: err.message });
  }
};

const createMilestone = async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user.id };
    const data = await progressService.createMilestone(payload);
    res.status(201).json({ success: true, message: "Thêm công việc thành công!", data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo công việc", error: err.message });
  }
};

// --- PHẦN 2: BÁO CÁO TIẾN ĐỘ (PROGRESS & SUBMISSIONS) ---
const getThesisProgress = async (req, res) => {
  try {
    const { thesisId } = req.params;
    if (!thesisId || isNaN(thesisId)) {
      return res.status(400).json({ success: false, message: "ID Đề tài không hợp lệ" });
    }
    const data = await progressService.getProgressByThesis(thesisId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi Server", error: err.message });
  }
};

const submitProgress = async (req, res) => {
  try {
    if (!req.file && !req.body.file_url) {
      return res.status(400).json({ success: false, message: "Vui lòng đính kèm file báo cáo!" });
    }

    const payload = {
      milestone_id: req.body.milestone_id,
      thesis_id: req.body.thesis_id || req.user.thesis_id,
      student_id: req.user.id, // Lấy ID từ token cho bảo mật
      file_name: req.body.file_name || req.file?.originalname,
      description: req.body.description || "",
      file_url: req.file ? `/uploads/${req.file.filename}` : req.body.file_url
    };

    if (!payload.milestone_id || !payload.thesis_id) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin cột mốc hoặc đề tài!" });
    }

    const data = await progressService.createProgress(payload);
    res.status(201).json({ success: true, message: "Nộp báo cáo thành công!", data });
  } catch (err) {
    // Bắt lỗi sinh viên nộp vượt cấp từ Service
    if (err.message.includes("chưa hoàn thành")) {
        return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: "Lỗi Server", error: err.message });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const isDeleted = await progressService.deleteSubmission(req.params.id, req.user.id);
    if (isDeleted) {
      res.json({ success: true, message: "Thu hồi báo cáo thành công!" });
    } else {
      res.status(400).json({ success: false, message: "Không tìm thấy báo cáo hoặc bạn không có quyền xóa!" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi thu hồi báo cáo", error: err.message });
  }
};

module.exports = {
  getMilestones,
  updateMilestone,
  createMilestone,
  getThesisProgress,
  submitProgress,
  deleteSubmission
};