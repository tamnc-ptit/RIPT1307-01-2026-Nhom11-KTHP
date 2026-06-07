const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const auth = require("../middlewares/auth");

router.use(auth);

// --- CỤ THỂ TRƯỚC (specific routes first) ---

// Theo submission
router.get(
  "/submission/:submissionId",
  commentController.getCommentsBySubmission,
);
router.post("/submission/:submissionId", commentController.createComment);

// Theo thesis
router.get("/thesis/:thesisId", commentController.getCommentsByThesis);

// Theo lớp - anchor phải trước /:classId
router.get("/class/:classId/anchor", commentController.getClassAnchor);
router.get("/class/:classId/students", commentController.getStudentsWithThesis);
router.get("/class/:classId", commentController.getCommentsByClass);
router.post("/class/:classId", commentController.createCommentForClass);

// CRUD cụ thể
router.get("/detail/:id", commentController.getCommentById);
router.put("/:id", commentController.updateComment);
router.delete("/:id", commentController.deleteComment);

// --- CHUNG - DYNAMIC ROUTE CUỐI CÙNG ---
router.post("/", commentController.postComment);
router.get("/:submission_id", commentController.getComments); // ← phải ở CUỐI

module.exports = router;
