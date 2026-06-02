// backend/routes/progress.routes.js
const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progress.controller");

// Lấy danh sách lịch sử báo cáo tiến độ của 1 đề tài cụ thể
router.get("/:thesisId", progressController.getThesisProgress);

// Nộp báo cáo tiến độ mới
router.post("/", progressController.submitProgress);

module.exports = router;