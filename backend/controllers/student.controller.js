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

exports.getProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const profile = await studentService.getProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: "Không tìm thấy thông tin sinh viên" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server khi tải hồ sơ", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    await studentService.updateProfile(userId, req.body);
    res.json({ message: "Cập nhật hồ sơ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server khi cập nhật hồ sơ", error: err.message });
  }
};