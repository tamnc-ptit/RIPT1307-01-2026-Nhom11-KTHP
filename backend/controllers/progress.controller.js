const progressService = require("../services/progress.service"); // Đảm bảo đúng đường dẫn file service của bạn

// --- PHẦN 1: CỘT MỐC (MILESTONES) ---

const getMilestones = async (req, res) => {
  try {
    const thesisId = req.params.thesisId || req.query.thesisId;
    console.log(">>> getMilestones called, thesisId:", thesisId); // log 1
    
    const data = await progressService.getMilestonesByThesis(thesisId);
    console.log(">>> data returned:", data); // log 2
    
    res.json({ success: true, data });
  } catch (err) {
    console.error(">>> getMilestones ERROR:", err.message); // log 3
    res.status(500).json({ success: false, message: "Lỗi lấy Milestones", error: err.message });
  }
};

// Hàm CREATE: Chặn sinh viên ngay tại đây
const createMilestone = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: "Access Denied: Sinh viên không được phép giao việc!" });
    }

    const payload = { ...req.body, created_by: req.user.id };
    const data = await progressService.createMilestone(payload);
    res.status(201).json({ success: true, message: "Thêm công việc thành công!", data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo công việc", error: err.message });
  }
};

// Hàm UPDATE (PATCH): Thông minh tự phân biệt Sinh viên / Giảng viên
const updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    // Nếu là Sinh viên -> Chỉ trích xuất đúng trường 'status' để cập nhật
    if (req.user.role === 'student') {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp trạng thái hợp lệ!" });
      }
      await progressService.updateMilestoneStatus(id, status); 
      return res.json({ success: true, message: "Cập nhật trạng thái công việc thành công!" });
    }

    // Nếu là Giảng viên -> Được cập nhật toàn bộ (tên, mô tả, deadline...)
    await progressService.updateMilestone(id, req.body);
    return res.json({ success: true, message: "Cập nhật chi tiết công việc thành công!" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật", error: err.message });
  }
};

// 🚀 Bổ sung hàm hứng riêng cho API /milestones/:id/status
const updateMilestoneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp trạng thái hợp lệ!" });
    }

    await progressService.updateMilestoneStatus(id, status);
    res.json({ success: true, message: "Cập nhật trạng thái công việc thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái", error: err.message });
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
      student_id: req.user.id,
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
  createMilestone,
  updateMilestone,
  updateMilestoneStatus, 
  getThesisProgress,
  submitProgress,
  deleteSubmission
};