const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");
const auth = require("../middlewares/auth");

router.use(auth); // Áp dụng auth middleware cho toàn bộ các route dưới đây

router.get("/dashboard/stats", lecturerController.getDashboardStats);
router.get("/dashboard/risks", lecturerController.getRiskFlags);
router.get("/classes", lecturerController.getClasses);
router.get("/classes/:classId/students", lecturerController.getClassStudents);
router.put("/theses/:id/approve", lecturerController.approveThesis);
router.put("/theses/:id/reject", lecturerController.rejectThesis);
router.get("/milestones", lecturerController.getMilestones);
router.post("/milestones", lecturerController.createMilestone);
router.put("/milestones/:id/feedback", lecturerController.updateMilestoneFeedback);
router.put("/theses/:id/finalize", lecturerController.finalizeThesis);
router.get("/reports/export-excel", lecturerController.exportReport);

// Sessions
router.get("/sessions", lecturerController.getSessions);
router.post("/sessions", lecturerController.createSession);
router.delete("/sessions/:id", lecturerController.deleteSession);

// Templates
router.get("/templates", lecturerController.getTemplates);
router.post("/templates", lecturerController.createTemplate);
router.put("/templates/:id", lecturerController.updateTemplate);
router.delete("/templates/:id", lecturerController.deleteTemplate);

module.exports = router;
