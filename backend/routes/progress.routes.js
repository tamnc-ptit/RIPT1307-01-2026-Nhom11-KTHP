const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload.middleware");
const progressController = require("../controllers/progress.controller");

router.use(auth);

router.patch("/status/:id", progressController.updateMilestoneStatus);


router.get("/milestones/:thesisId", progressController.getMilestones);


router.get("/:thesisId", progressController.getThesisProgress);
router.post("/", upload.single("file"), progressController.submitProgress);
router.delete("/submissions/:id", progressController.deleteSubmission);

module.exports = router;