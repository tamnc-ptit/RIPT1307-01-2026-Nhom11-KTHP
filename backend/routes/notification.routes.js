const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const auth = require("../middlewares/auth");

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  next();
};

router.use(auth);
router.get("/", notificationController.listForUser);
router.patch("/:id/read", notificationController.markRead);

router.post(
  "/broadcast",
  requireRole("admin", "lecturer"),
  notificationController.broadcast
);
module.exports = router;
