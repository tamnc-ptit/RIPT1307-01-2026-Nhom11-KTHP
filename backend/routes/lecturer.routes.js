const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");
const dashboardController = require("../controllers/dashboard.controller")
const classController = require("../controllers/class.controller")
const lecturerThesisController = require("../controllers/lecturerThesis.controller");
const auth = require("../middlewares/auth");

router.use(auth); // Áp dụng auth middleware cho toàn bộ các route dưới đây

router.get("/dashboard/stats", dashboardController.getLecturerDashboard);
router.get("/dashboard/risks", dashboardController.getRiskFlags);
router.get("/classes", classController.getLecturerClasses);
router.get("/classes/:classId/students", classController.getLecturerClassStudents);
  router.put("/theses/:id/approve", lecturerThesisController.approveThesis);
  router.put("/theses/:id/reject", lecturerThesisController.rejectThesis);
router.get("/milestones", lecturerController.getMilestones);
  router.post("/milestones", lecturerThesisController.createMilestone);
router.put("/milestones/:id/feedback", lecturerController.updateMilestoneFeedback);
  router.put("/theses/:id/finalize", lecturerThesisController.finalizeThesis);
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

  // Lecturer Proposals (My Proposals)
  router.get("/proposals", lecturerController.getMyProposals);
  router.post("/proposals", lecturerController.createProposal);
  router.put("/proposals/:id", lecturerController.updateProposal);
  router.delete("/proposals/:id", lecturerController.deleteProposal);

  // Thesis Detail
  router.get("/theses/:id/detail", lecturerThesisController.getThesisDetail);

  // Dedicated lecturer thesis list with filters (for better UX)
  router.get("/theses", lecturerThesisController.getLecturerTheses);

  // Bulk actions for lecturer
  router.post("/theses/bulk-approve", lecturerThesisController.bulkApproveTheses);
  router.post("/theses/bulk-reject", lecturerThesisController.bulkRejectTheses);

  module.exports = router;
