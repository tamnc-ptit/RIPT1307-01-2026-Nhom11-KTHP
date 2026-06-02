const submissionService = require("../services/submission.service");

const getSubmissions = async (req, res) => {
  try {
    const { milestone_id, thesis_id } = req.query;

    if (!milestone_id || !thesis_id) {
      return res.status(400).json({ message: "Thiếu milestone_id hoặc thesis_id" });
    }

    const data = await submissionService.getSubmissionsByMilestone(milestone_id, thesis_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Error in getSubmissions:", err);
    res.status(500).json({ message: "Lỗi Server khi lấy lịch sử nộp bài", error: err.message });
  }
};

const submitAssignment = async (req, res) => {
  const { milestone_id, thesis_id, student_id, file_name, file_url, note } = req.body;

  // Rào lỗi cực đoan: Kiểm tra dữ liệu đầu vào
  if (!milestone_id || !thesis_id || !student_id || !file_name || !file_url) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc (milestone, thesis, student, file)" });
  }

  try {
    const data = await submissionService.createSubmission({
      milestone_id,
      thesis_id,
      student_id,
      file_name,
      file_url,
      note
    });

    res.status(201).json({ 
      success: true, 
      message: "Nộp bài thành công!", 
      data 
    });
  } catch (err) {
    console.error("Error in submitAssignment:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi nộp bài", error: err.message });
  }
};

module.exports = {
  getSubmissions,
  submitAssignment
};