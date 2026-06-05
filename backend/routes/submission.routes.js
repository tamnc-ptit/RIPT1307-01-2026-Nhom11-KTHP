const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");


const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

router.use(authMiddleware);


router.get("/", submissionController.getSubmissions);


router.get("/:id/download", submissionController.downloadFile);


router.get("/:id", submissionController.getSubmissionById);


router.post(
  "/",
  roleMiddleware("student"),
  uploadSingle("file"),
  submissionController.createSubmission 
);


router.delete(
  "/:id",
  roleMiddleware("student", "lecturer", "admin"),
  submissionController.deleteSubmission
);

module.exports = router;