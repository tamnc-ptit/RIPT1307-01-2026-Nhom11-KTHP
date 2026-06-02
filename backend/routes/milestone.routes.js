const express = require("express");
const router = express.Router();
const milestoneController = require("../controllers/milestone.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// GET  /api/milestones?thesis_id=1
router.get("/", milestoneController.getMilestones);

// GET  /api/milestones/:id
router.get("/:id", milestoneController.getMilestoneById);

// POST /api/milestones   — chỉ lecturer, admin
router.post("/", roleMiddleware("lecturer", "admin"), milestoneController.createMilestone);

// PUT  /api/milestones/:id
router.put("/:id", roleMiddleware("lecturer", "admin"), milestoneController.updateMilestone);

// DELETE /api/milestones/:id
router.delete("/:id", roleMiddleware("lecturer", "admin"), milestoneController.deleteMilestone);

module.exports = router;