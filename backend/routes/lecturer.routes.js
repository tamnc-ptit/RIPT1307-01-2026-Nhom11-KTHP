const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");

router.get("/dashboard/stats", lecturerController.getDashboardStats);
router.get("/dashboard/risks", lecturerController.getRiskFlags);

module.exports = router;
