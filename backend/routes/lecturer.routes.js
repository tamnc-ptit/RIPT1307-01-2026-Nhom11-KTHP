const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");

router.get("/dashboard/stats", lecturerController.getDashboardStats);
router.get("/dashboard/risks", lecturerController.getRiskFlags);
router.get("/classes", lecturerController.getClasses);
router.put("/theses/:id/approve", lecturerController.approveThesis);
router.put("/theses/:id/reject", lecturerController.rejectThesis);
router.get("/milestones", lecturerController.getMilestones);
router.put("/milestones/:id/feedback", lecturerController.updateMilestoneFeedback);
router.put("/theses/:id/finalize", lecturerController.finalizeThesis);
router.get("/reports/export-excel", lecturerController.exportReport);

module.exports = router;
