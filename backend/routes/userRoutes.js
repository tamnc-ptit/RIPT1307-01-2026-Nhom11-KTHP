const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/authMiddleware");

// Get all users
router.get("/", authMiddleware, userController.getUsers);

// Get single user
router.get("/:id", authMiddleware, userController.getUserById);

// Get current logged-in user profile
router.get("/profile/me", authMiddleware, userController.getProfile);

// Update user
router.patch("/:id", authMiddleware, userController.updateUser);

// Delete user
router.delete("/:id", authMiddleware, userController.deleteUser);

module.exports = router;