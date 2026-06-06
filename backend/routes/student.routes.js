const express = require("express");
const router = express.Router();

// Import Middleware
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload.middleware");

// Import Controllers
const studentController = require("../controllers/student.controller");
const progressController = require("../controllers/progress.controller");

// Xác thực sinh viên (Tất cả route bên dưới đều phải có token)
router.use(auth);

// 1. DASHBOARD
router.get("/dashboard", studentController.getStudentDashboard);

// 2. PROFILE (Hồ sơ cá nhân)
router.get("/profile", studentController.getProfile);
router.put("/profile", studentController.updateProfile);

// 3. MILESTONES (Cột mốc)
router.get("/theses/:thesisId/milestones", progressController.getMilestones);
router.post("/milestones", progressController.createMilestone);
router.patch("/milestones/:id", progressController.updateMilestone);

// 4. PROGRESS (Nộp bài báo cáo)
router.get("/theses/:thesisId/progress", progressController.getThesisProgress);
router.post("/progress", upload.single("file"), progressController.submitProgress);
router.delete("/submissions/:id", progressController.deleteSubmission);

module.exports = router;