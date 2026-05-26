const lecturerService = require("../services/lecturer.service");
const { poolPromise, sql } = require("../config/db");
const milestoneService = require("../services/milestone.service");


exports.getMilestones = async (req, res) => {
  const { thesisId } = req.query;
  if (!thesisId) return res.status(400).json({ message: "Thiếu thesisId" });

  try {
    const milestones = await milestoneService.getMilestonesByThesis(thesisId);
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.updateMilestoneFeedback = async (req, res) => {
  const { id } = req.params;
  const lecturerId = req.user?.id;

  // Permission: chỉ được chấm milestone của thesis mình hướng dẫn
  const isOwner = await lecturerService.verifyMilestoneOwnership(id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền chấm mốc này" });
  }

  try {
    const result = await milestoneService.updateMilestoneFeedback(id, req.body);

    // Gửi thông báo chấm điểm
    const pool = await poolPromise;
    const milestoneInfo = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT m.thesis_id, m.title, t.student_id, t.title AS thesis_title
        FROM Milestones m
        JOIN Thesis t ON m.thesis_id = t.id
        WHERE m.id = @id
      `);

    if (milestoneInfo.recordset[0]) {
      const { student_id, title, thesis_title } = milestoneInfo.recordset[0];
      const scoreText = req.body.score ? ` - Điểm: ${req.body.score}` : "";
      await lecturerService.createNotification({
        user_id: student_id,
        type: "submission_graded",
        title: "Bài nộp đã được chấm",
        message: `Mốc "${title}" của đề tài "${thesis_title}" đã được Giảng viên chấm điểm${scoreText}.`,
        ref_type: "milestone",
        ref_id: parseInt(id)
      });

      // Audit log
      await lecturerService.logAudit({
        actor_id: lecturerId,
        actor_name: req.user?.name || req.user?.email,
        action: "GRADE",
        target_table: "Milestones",
        target_id: parseInt(id),
        new_value: { score: req.body.score, comment: req.body.comment, status: req.body.status }
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật phản hồi", error: err.message });
  }
};


exports.exportReport = async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: "Thiếu classId" });

  try {
    if (req.user && req.user.role === "lecturer") {
      const classes = await lecturerService.getClasses(req.user.id);
      const isOwner = classes.some(c => c.id == classId);
      if (!isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xuất báo cáo lớp học này!" });
      }
    }
    const { workbook, className } = await lecturerService.exportClassReport(classId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(className)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xuất báo cáo", error: err.message });
  }
};


// --- Thesis Detail ---
exports.getThesisDetail = async (req, res) => {
  const { id } = req.params;
  const lecturerId = req.user?.id;

  try {
    const data = await lecturerService.getThesisDetail(id, lecturerId);
    res.json(data);
  } catch (err) {
    res.status(403).json({ message: err.message || "Lỗi khi lấy chi tiết đề tài" });
  }
};

// --- Custom Milestones ---
exports.createMilestone = async (req, res) => {
  const { thesis_id } = req.body;
  const lecturerId = req.user?.id;

  if (!thesis_id) {
    return res.status(400).json({ message: "Thiếu thesis_id" });
  }

  // Permission: chỉ được tạo milestone cho thesis của mình
  const isOwner = await lecturerService.verifyThesisOwnership(thesis_id, lecturerId);
  if (!isOwner) {
    return res.status(403).json({ message: "Bạn không có quyền thêm mốc cho đề tài này" });
  }

  try {
    const data = await lecturerService.createMilestone(req.body);

    // Audit log
    await lecturerService.logAudit({
      actor_id: lecturerId,
      actor_name: req.user?.name || req.user?.email,
      action: "CREATE_MILESTONE",
      target_table: "Milestones",
      target_id: data?.id,
      new_value: req.body
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Milestone", error: err.message });
  }
};


