const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic.controller");
const auth = require("../middlewares/auth");

// Public: list and get
router.get("/", topicController.list);
router.get("/:id", topicController.get);

// Auth required: register
router.post("/:id/register", auth, topicController.register);

module.exports = router;
