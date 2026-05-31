const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");
const dashboardController = require("../controllers/dashboard.controller")
const classController = require("../controllers/class.controller")
const lecturerThesisController = require("../controllers/lecturerThesis.controller");
const proposalController = require("../controllers/proposal.controller");
const templateController = require("../controllers/template.controller");
const auth = require("../middlewares/auth");

router.use(auth); // Áp dụng auth middleware cho toàn bộ các route dưới đây
console.log("Checking controllers:");
console.log("lecturerController:", !!lecturerController.getMilestones);
console.log("dashboardController:", !!dashboardController.getLecturerDashboard);
console.log("classController:", !!classController.getLecturerClasses);
console.log("lecturerThesisController:", !!lecturerThesisController.approveThesis);
console.log("proposalController:", !!proposalController.getMyProposals);
console.log("templateController:", !!templateController.getTemplates);

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

// Profile
router.get("/profile", lecturerController.getProfile);
router.put("/profile", lecturerController.updateProfile);

// Sessions
router.get("/sessions", lecturerController.getSessions);
router.post("/sessions", lecturerController.createSession);
router.delete("/sessions/:id", lecturerController.deleteSession);

// Templates
router.get("/templates", templateController.getTemplates);
router.post("/templates", templateController.createTemplate);
  router.put("/templates/:id", templateController.updateTemplate);
  router.delete("/templates/:id", templateController.deleteTemplate);

  // Proposals (My Proposals) - managed by Lecturer, module is common
  router.get("/proposals", proposalController.getMyProposals);
  router.post("/proposals", proposalController.createProposal);
  router.put("/proposals/:id", proposalController.updateProposal);
  router.delete("/proposals/:id", proposalController.deleteProposal);
  router.get("/proposals/:proposalId/registrations", proposalController.getProposalRegistrations);

  // Thesis Detail
  router.get("/theses/:id/detail", lecturerThesisController.getThesisDetail);

  // Dedicated lecturer thesis list with filters (for better UX)
  router.get("/theses", lecturerThesisController.getLecturerTheses);

  // Bulk actions for lecturer
  router.post("/theses/bulk-approve", lecturerThesisController.bulkApproveTheses);
  router.post("/theses/bulk-reject", lecturerThesisController.bulkRejectTheses);

  module.exports = router;
