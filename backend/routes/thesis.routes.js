// backend/routes/thesis.routes.js
const express = require("express");
const router = express.Router();


const thesisController = require("../controllers/thesis.controller");

// 1. API lấy danh sách đồ án (dành cho Admin/Giảng viên)
router.get("/", thesisController.getAdminThesis);

// 2. API Gửi form đăng ký đồ án 

router.post("/", thesisController.createThesis);

// 3. Các API cập nhật đồ án (Giảng viên/Admin duyệt)
router.put("/:id", thesisController.updateThesis); 
router.patch("/:id", thesisController.updateThesis);
router.delete("/:id", thesisController.deleteThesis);
router.patch("/:id/review", thesisController.updateThesisReviewStatus);

module.exports = router;