const express = require("express");
const router = express.Router();

// Import Middleware
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload.middleware");

// Import Controllers
const studentController = require("../controllers/student.controller");
const progressController = require("../controllers/progress.controller");

// Xác thực sinh viên
router.use(auth);

// 1. DASHBOARD
router.get("/dashboard", studentController.getStudentDashboard);


// 2. MILESTONES (Cột mốc)

router.get("/theses/:thesisId/milestones", progressController.getMilestones);
router.post("/milestones", progressController.createMilestone);
router.patch("/milestones/:id", progressController.updateMilestone);


// 3. PROGRESS (Nộp bài báo cáo)

router.get("/theses/:thesisId/progress", progressController.getThesisProgress);
router.post("/progress", upload.single("file"), progressController.submitProgress); // Chèn middleware upload file vào đây
router.delete("/submissions/:id", progressController.deleteSubmission);

module.exports = router;