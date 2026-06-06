const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const auth = require("../middlewares/auth"); // Dùng middleware auth của bạn

router.use(auth);

router.post("/", commentController.postComment);
router.get("/:submission_id", commentController.getComments);

module.exports = router;