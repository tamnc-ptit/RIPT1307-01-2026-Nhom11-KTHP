const studentService = require("../services/student.service");

exports.getStudentDashboard = async (req, res) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ message: "Chỉ sinh viên mới được truy cập" });
  }

  const studentId = req.user.id;

  try {
    const data = await studentService.getStudentDashboard(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy dữ liệu Dashboard", error: err.message });
  }
};