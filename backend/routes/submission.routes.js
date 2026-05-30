const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

router.use(authMiddleware);

// GET /api/submissions?thesis_id=1&milestone_id=2&student_id=3
router.get("/", submissionController.getSubmissions);

// GET /api/submissions/:id/download
router.get("/:id/download", submissionController.downloadFile);

// GET /api/submissions/:id
router.get("/:id", submissionController.getSubmissionById);

// POST /api/submissions  — multipart/form-data, chỉ student
// Body fields: file (File), milestoneId, thesisId, studentId, note
router.post(
  "/",
  roleMiddleware("student"),
  uploadSingle("file"),
  submissionController.createSubmission
);

// DELETE /api/submissions/:id
router.delete(
  "/:id",
  roleMiddleware("student", "lecturer", "admin"),
  submissionController.deleteSubmission
);

module.exports = router;