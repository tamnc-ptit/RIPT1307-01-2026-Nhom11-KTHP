const express = require("express");
const router = express.Router();
const progressService = require("../services/progress.service");

// Import 2 "vũ khí" bảo mật và xử lý file
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload.middleware");


router.use(auth);

// 2. Lấy danh sách công việc (Milestones)
router.get("/theses/:thesisId/milestones", async (req, res) => {
  try {
    const { thesisId } = req.params;
    
    const data = await progressService.getMilestonesByThesis(thesisId);
    
    res.json({ data: data });
  } catch (err) {
    console.error("Lỗi lấy Milestones:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

// 3. Cập nhật trạng thái công việc 
router.patch("/milestones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await progressService.updateMilestoneStatus(id, status);
    res.json({ message: "Cập nhật trạng thái thành công!" });
  } catch (err) {
    console.error("Lỗi update milestone:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

// 4. Thêm công việc mới 
router.post("/milestones", async (req, res) => {
  try {
    // Nhét req.user.id (giải mã từ token) vào cục data đẩy xuống DB
    const payload = { 
      ...req.body, 
      created_by: req.user.id 
    };
    const data = await progressService.createMilestone(payload);
    
    const formattedData = {
      id: data.id,
      thesis_id: data.thesis_id,
      title: data.title,
      description: data.description,
      deadline: req.body.deadline, 
      status: 'pending'
    };

    res.status(201).json({ message: "Thêm công việc thành công!", data: formattedData });
  } catch (err) {
    console.error("Lỗi tạo công việc mới:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi thêm công việc", error: err.message });
  }
});

// 5. API NỘP BÁO CÁO (Upload File vật lý)
router.post("/progress", upload.single("file"), async (req, res) => {
  try {

    const file_url = req.file ? `/uploads/${req.file.filename}` : req.body.file_url;
    
    if (!file_url) {
      return res.status(400).json({ message: "Vui lòng đính kèm file báo cáo!" });
    }

    const payload = {
      milestone_id: req.body.milestone_id,
      thesis_id: req.body.thesis_id || req.user.thesis_id, 
      student_id: req.user.id, 
      file_name: req.body.file_name,
      description: req.body.description,
      file_url: file_url 
    };

    const data = await progressService.createProgress(payload);
    res.status(201).json({ message: "Nộp báo cáo thành công!", data });
  } catch (err) {
    console.error("Lỗi nộp báo cáo:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});
router.delete("/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const isDeleted = await progressService.deleteSubmission(id);

    if (isDeleted) {
      res.json({ message: "Thu hồi báo cáo thành công!" });
    } else {
      res.status(400).json({ message: "Không tìm thấy báo cáo trong Database hoặc sai tên bảng!" });
    }
  } catch (err) {
    console.error("Lỗi thu hồi báo cáo:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});
module.exports = router;