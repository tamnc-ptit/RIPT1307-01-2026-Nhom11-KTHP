const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const auth = require("../middlewares/auth");

router.use(auth);
router.get("/", notificationController.listForUser);
router.patch("/:id/read", notificationController.markRead);

module.exports = router;
