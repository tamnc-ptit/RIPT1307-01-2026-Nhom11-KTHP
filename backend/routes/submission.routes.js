const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");

// Route lấy lịch sử: GET /api/submission?milestone_id=...&thesis_id=...
router.get("/", submissionController.getSubmissions);

// Route nộp bài: POST /api/submission
router.post("/", submissionController.submitAssignment);

module.exports = router;