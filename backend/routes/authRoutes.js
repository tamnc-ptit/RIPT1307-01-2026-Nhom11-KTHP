const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// 1. Route Đăng ký (Register)
router.post("/register", authController.register);

// 2. Route Đăng nhập (Login) - CÁI NÀY ĐANG THIẾU NÈ!
router.post("/login", authController.login);

module.exports = router;
