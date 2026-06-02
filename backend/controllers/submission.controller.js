const submissionService = require("../services/submission.service");
const path = require("path");
const fs = require("fs");

// Map extension → content-type (thay cho mime_type vì DB không lưu)
const MIME_MAP = {
  ".pdf":  "application/pdf",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt":  "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip":  "application/zip",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
};

exports.getSubmissions = async (req, res) => {
  const { thesis_id, milestone_id, student_id } = req.query;

  if (!thesis_id) {
    return res.status(400).json({ message: "thesis_id là bắt buộc" });
  }

  try {
    const submissions = await submissionService.getSubmissionsByThesis(
      parseInt(thesis_id),
      {
        milestoneId: milestone_id ? parseInt(milestone_id) : null,
        studentId:   student_id   ? parseInt(student_id)   : null,
      }
    );

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const data = submissions.map((s) => ({
      ...s,
      file_url: `${baseUrl}/${s.file_url}`,
    }));

    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách submission", error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await submissionService.getSubmissionById(parseInt(req.params.id));
    /*if (!submission) {
      return res.status(404).json({ message: "Không tìm thấy submission" });
    }*/

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    res.json({ ...submission, file_url: `${baseUrl}/${submission.file_url}` });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy submission", error: err.message });
  }
};

exports.createSubmission = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file để nộp" });
  }

  const { milestoneId, thesisId, studentId, note } = req.body;

  if (!milestoneId || !thesisId || !studentId) {
    return res.status(400).json({
      message: "Thiếu thông tin bắt buộc: milestoneId, thesisId, studentId",
    });
  }

  try {
    const submission = await submissionService.createSubmission(
      {
        milestoneId: parseInt(milestoneId),
        thesisId:    parseInt(thesisId),
        studentId:   parseInt(studentId),
        note,
      },
      req.file
    );

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    res.status(201).json({
      message: "Nộp bài thành công!",
      data: { ...submission, file_url: `${baseUrl}/${submission.file_url}` },
    });
  } catch (err) {
    const httpStatus = err.message.includes("Không tìm thấy")  ? 404
                     : err.message.includes("đã đóng")         ? 400
                     : 500;
    res.status(httpStatus).json({ message: err.message, error: err.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    await submissionService.deleteSubmission(parseInt(req.params.id));
    res.json({ message: "Xóa submission thành công!" });
  } catch (err) {
    const httpStatus = err.message.includes("Không tìm thấy") ? 404 : 500;
    res.status(httpStatus).json({ message: err.message, error: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const submission = await submissionService.getSubmissionById(parseInt(req.params.id));
    if (!submission) {
      return res.status(404).json({ message: "Không tìm thấy submission" });
    }

    const filePath = path.join(__dirname, "../../", submission.file_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File không còn tồn tại trên server" });
    }

    // Lấy content-type từ extension vì DB không lưu mime_type
    const ext = path.extname(submission.file_name).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(submission.file_name)}"`);
    res.setHeader("Content-Type", contentType);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tải file", error: err.message });
  }
};