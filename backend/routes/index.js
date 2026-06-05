const express = require("express");
const router = express.Router();
const userRoutes = require("./user.routes");
const thesisRoutes = require("./thesis.routes");
const notificationRoutes = require("./notification.routes");
const topicRoutes = require("./topic.routes");

router.use("/users", userRoutes);
router.use("/thesis", thesisRoutes);
router.use("/notifications", notificationRoutes);
router.use("/topics", topicRoutes);

module.exports = router;