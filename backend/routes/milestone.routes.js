const express = require("express");
const router = express.Router();
const milestoneController = require("../controllers/milestone.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Các route quản lý milestone thuần túy
router.get("/", milestoneController.getMilestones);
router.get("/:id", milestoneController.getMilestoneById);
router.post("/", roleMiddleware("lecturer", "admin"), milestoneController.createMilestone);
router.put("/:id", roleMiddleware("lecturer", "admin"), milestoneController.updateMilestone);
router.delete("/:id", roleMiddleware("lecturer", "admin"), milestoneController.deleteMilestone);

module.exports = router;