// backend/controllers/progress.controller.js
const progressService = require("../services/progress.service");

const getThesisProgress = async (req, res) => {
  try {
    const { thesisId } = req.params;

    if (!thesisId || isNaN(thesisId)) {
      return res.status(400).json({ message: "ID Đề tài không hợp lệ hoặc bị thiếu" });
    }

    const data = await progressService.getProgressByThesis(thesisId);
    res.json({ data });
  } catch (err) {
    console.error("Lỗi getThesisProgress:", err);
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

const submitProgress = async (req, res) => {
  const { thesis_id, student_id, file_name, file_url, description } = req.body;

  if (!thesis_id) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc: thesis_id" });
  }
  if (!file_url || !file_name) {
    return res.status(400).json({ message: "Vui lòng cung cấp link tài liệu và tên file báo cáo" });
  }

  try {
    const data = await progressService.createProgress(req.body);
    res.status(201).json({ message: "Nộp báo cáo tiến độ thành công!", data });
  } catch (err) {
    console.error("Lỗi submitProgress:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi nộp tiến độ", error: err.message });
  }
};

module.exports = {
  getThesisProgress,
  submitProgress,
};