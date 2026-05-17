const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.Controller");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/users", authMiddleware, roleMiddleware("admin"), authController.getAllUsers);
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.delete("/users/:id", authMiddleware, roleMiddleware("admin"), authController.deleteUser);
router.patch("/users/:id/role", authMiddleware, roleMiddleware("admin"), authController.updateRole);

module.exports = router;
