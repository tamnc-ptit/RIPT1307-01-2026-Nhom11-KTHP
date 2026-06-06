// backend/routes/thesis.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const thesisController = require("../controllers/thesis.controller");

router.get("/", thesisController.getAdminThesis);
router.post("/", auth, thesisController.createThesis);

// 3. Các API cập nhật đồ án (Giảng viên/Admin duyệt)
router.put("/:id", thesisController.updateThesis); 
router.patch("/:id", thesisController.updateThesis);
router.delete("/:id", thesisController.deleteThesis);
router.patch("/:id/review", thesisController.updateThesisReviewStatus);

module.exports = router;