const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturer.controller");
const dashboardController = require("../controllers/dashboard.controller");
const classController = require("../controllers/class.controller");
const lecturerThesisController = require("../controllers/lecturerThesis.controller");
const proposalController = require("../controllers/proposal.controller");
const templateController = require("../controllers/template.controller");
const commentController = require("../controllers/comment.controller");
const auth = require("../middlewares/auth");

// Áp dụng auth middleware cho toàn bộ các route bảo mật phía dưới
router.use(auth);

// =========================================================================
// 1. DASHBOARD & LỚP HỌC PHẦN
// =========================================================================
router.get("/dashboard/stats", dashboardController.getLecturerDashboard);
router.get("/dashboard/risks", dashboardController.getRiskFlags);
router.get("/classes", classController.getLecturerClasses);
router.get(
  "/classes/:classId/students",
  classController.getLecturerClassStudents,
);

// =========================================================================
// 2. CỘT MỐC TIẾN ĐỘ & BÁO CÁO EXCEL
// =========================================================================
router.get("/milestones", lecturerController.getMilestones);
router.post("/milestones", lecturerThesisController.createMilestone);
router.put(
  "/milestones/:id/feedback",
  lecturerController.updateMilestoneFeedback,
);
router.get("/reports/export-excel", lecturerController.exportReport);

// =========================================================================
// 3. HỒ SƠ CÁ NHÂN (PROFILE) & ĐỢT ĐĂNG KÝ (SESSIONS)
// =========================================================================
router.get("/profile", lecturerController.getProfile);
router.put("/profile", lecturerController.updateProfile);

router.get("/sessions", lecturerController.getSessions);
router.post("/sessions", lecturerController.createSession);
router.delete("/sessions/:id", lecturerController.deleteSession);

// =========================================================================
// 4. BIỂU MẪU ĐỒ ÁN (TEMPLATES)
// =========================================================================
router.get("/templates", templateController.getTemplates);
router.post("/templates", templateController.createTemplate);
router.put("/templates/:id", templateController.updateTemplate);
router.delete("/templates/:id", templateController.deleteTemplate);

// =========================================================================
// 5. ĐỀ XUẤT ĐỀ TÀI (PROPOSALS)
// =========================================================================
router.get("/proposals", proposalController.getMyProposals);
router.post("/proposals", proposalController.createProposal);
router.put("/proposals/:id", proposalController.updateProposal);
router.delete("/proposals/:id", proposalController.deleteProposal);
router.get(
  "/proposals/:proposalId/registrations",
  proposalController.getProposalRegistrations,
);

// =========================================================================
// 6. 🔥 KHU VỰC ĐỒNG BỘ ĐỀ TÀI (THESIS / THESES) - CHẶN ĐỨNG LỖI 404
// =========================================================================

// --- Cấu hình Route Số Ít (/thesis) để khớp với một số trang Admin/Giảng viên cũ ---
router.put("/thesis/:id/approve", lecturerThesisController.approveThesis);
router.put("/thesis/:id/reject", lecturerThesisController.rejectThesis);
router.put("/thesis/:id/finalize", lecturerThesisController.finalizeThesis);
router.get("/thesis/:id/detail", lecturerThesisController.getThesisDetail);
router.get("/thesis", lecturerThesisController.getLecturerTheses);
router.post("/thesis/bulk-approve", lecturerThesisController.bulkApproveTheses);
router.post("/thesis/bulk-reject", lecturerThesisController.bulkRejectTheses);

// --- Cấu hình Route Số Nhiều (/theses) phòng thủ tối đa cho Frontend mới ---
router.put("/theses/:id/approve", lecturerThesisController.approveThesis);
router.put("/theses/:id/reject", lecturerThesisController.rejectThesis);
router.put("/theses/:id/finalize", lecturerThesisController.finalizeThesis);
router.get("/theses/:id/detail", lecturerThesisController.getThesisDetail);
router.get("/theses", lecturerThesisController.getLecturerTheses);
router.post("/theses/bulk-approve", lecturerThesisController.bulkApproveTheses);
router.post("/theses/bulk-reject", lecturerThesisController.bulkRejectTheses);

// =========================================================================
// 7. DIỄN ĐÀN THẢO LUẬN & TRỰC KẾT NỐI BÌNH LUẬN (COMMENTS)
// =========================================================================
router.get(
  "/comments/submission/:submissionId",
  commentController.getCommentsBySubmission,
);
router.get("/comments/thesis/:thesisId", commentController.getCommentsByThesis);
router.get("/comments/class/:classId", commentController.getCommentsByClass);
router.get("/comments/class/:classId/anchor", commentController.getClassAnchor);
router.get(
  "/students-with-thesis/:classId",
  commentController.getStudentsWithThesis,
);
router.get("/comments/:id", commentController.getCommentById);
router.post(
  "/comments/submission/:submissionId",
  commentController.createComment,
);
router.post(
  "/comments/class/:classId",
  commentController.createCommentForClass,
);
router.put("/comments/:id", commentController.updateComment);
router.delete("/comments/:id", commentController.deleteComment);

module.exports = router;
