const express = require("express");
const router = express.Router();
const progressService = require("../services/progress.service");

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

// 2. Cập nhật trạng thái công việc 
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

// 3. Thêm công việc mới 
router.post("/milestones", async (req, res) => {
  try {
    const data = await progressService.createMilestone(req.body);
    
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

module.exports = router;