const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");

router.get("/dashboard/stats", lecturerController.getDashboardStats);
router.get("/dashboard/risks", lecturerController.getRiskFlags);
router.get("/classes", lecturerController.getClasses);
router.put("/theses/:id/approve", lecturerController.approveThesis);
router.put("/theses/:id/reject", lecturerController.rejectThesis);

module.exports = router;
