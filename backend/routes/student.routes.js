const express = require("express");
const router = express.Router();

// Import các Service và Middleware
const studentService = require("../services/student.service");
const progressService = require("../services/progress.service");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload.middleware");

// Áp dụng xác thực cho toàn bộ route sinh viên
router.use(auth);

// 1. DASHBOARD: Lấy thông tin tổng quan (thesis, advisor, status)
router.get("/dashboard", async (req, res) => {
  try {
    const data = await studentService.getStudentDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu Dashboard", error: err.message });
  }
});

// 2. MILESTONES: Lấy danh sách cột mốc theo đề tài
router.get("/theses/:thesisId/milestones", async (req, res) => {
  try {
    const { thesisId } = req.params;
    const data = await progressService.getMilestonesByThesis(thesisId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi lấy Milestones", error: err.message });
  }
});

// 3. MILESTONES: Cập nhật trạng thái
router.patch("/milestones/:id", async (req, res) => {
  try {
    await progressService.updateMilestoneStatus(req.params.id, req.body.status);
    res.json({ success: true, message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái", error: err.message });
  }
});

// 4. MILESTONES: Tạo mới cột mốc
router.post("/milestones", async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user.id };
    const data = await progressService.createMilestone(payload);
    res.status(201).json({ success: true, message: "Thêm công việc thành công!", data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo công việc", error: err.message });
  }
});

// 5. PROGRESS: Nộp báo cáo tiến độ (Upload File)
router.post("/progress", upload.single("file"), async (req, res) => {
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

    // Validate dữ liệu bắt buộc
    if (!payload.milestone_id || !payload.thesis_id) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin cột mốc hoặc đề tài!" });
    }

    const data = await progressService.createProgress(payload);
    res.status(201).json({ success: true, message: "Nộp báo cáo thành công!", data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi Server", error: err.message });
  }
});

// 6. SUBMISSIONS: Thu hồi báo cáo
router.delete("/submissions/:id", async (req, res) => {
  try {
    const isDeleted = await progressService.deleteSubmission(req.params.id);
    if (isDeleted) {
      res.json({ success: true, message: "Thu hồi báo cáo thành công!" });
    } else {
      res.status(400).json({ success: false, message: "Không tìm thấy báo cáo hoặc không thể xóa!" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi thu hồi báo cáo", error: err.message });
  }
});

module.exports = router;