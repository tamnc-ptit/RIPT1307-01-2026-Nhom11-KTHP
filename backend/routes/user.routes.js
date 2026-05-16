const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

// ==========================================
// ĐÃ SỬA: Loại bỏ chữ "/users" thừa để tránh lỗi cộng dồn thành /api/users/users
// ==========================================

// Tuyến đường thực tế: GET http://localhost:5000/api/users (Có lọc ?role=lecturer)
router.get("/", userController.getUsers);

// Tuyến đường thực tế: POST http://localhost:5000/api/users/bulk
router.post("/bulk", userController.bulkCreateUsers);

// Tuyến đường thực tế: PATCH http://localhost:5000/api/users/:id
router.patch("/:id", userController.updateUser);

// Tuyến đường thực tế: PATCH http://localhost:5000/api/users/:id/role
router.patch("/:id/role", authController.updateRole);

// Tuyến đường thực tế: DELETE http://localhost:5000/api/users/:id
router.delete("/:id", userController.deleteUser);

module.exports = router;
