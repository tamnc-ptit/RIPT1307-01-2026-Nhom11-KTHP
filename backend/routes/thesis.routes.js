// backend/routes/thesis.routes.js
const express = require("express");
const router = express.Router();

// Gọi ĐÚNG thesis.controller, tuyệt đối không gọi user.controller ở đây
const thesisController = require("../controllers/thesis.controller");

// 1. API lấy danh sách đồ án (dành cho Admin/Giảng viên)
router.get("/", thesisController.getAdminThesis);

// 2. API Gửi form đăng ký đồ án (Sinh viên nộp phiếu sẽ chạy vào ĐÂY)
// Nó sẽ gọi hàm createThesis mà chúng ta đã viết lúc nãy.
router.post("/", thesisController.createThesis);

// 3. Các API cập nhật đồ án (Giảng viên/Admin duyệt)
router.patch("/:id", thesisController.updateThesis);
router.patch("/:id/review", thesisController.updateThesisReviewStatus);

module.exports = router; 