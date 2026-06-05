const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", userController.getUsers);
router.post("/bulk", userController.bulkCreateUsers);
router.get("/profile/me", authMiddleware, userController.getProfile);
router.get("/me", authMiddleware, userController.getProfile);
router.patch("/:id", userController.updateUser);
router.patch("/:id/role", authController.updateRole);
router.delete("/:id", userController.deleteUser);

// --- ĐÂY LÀ ĐOẠN CODE BẠN BỊ THIẾU ---
// API này để Frontend gọi lấy danh sách giảng viên:
router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.post("/bulk", userController.bulkCreateUsers);
router.get("/admin", userController.getUsersByRole);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// (Tạm ẩn 2 API profile này nếu chưa dùng)
// router.get("/profile", userController.getProfile);         
// router.patch("/profile", userController.updateProfile);    

module.exports = router;