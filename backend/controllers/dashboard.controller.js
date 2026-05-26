const dashboardService = require("../services/dashboard.service")
const { poolPromise, sql } = require("../config/db");

exports.getLecturerDashboard = async (req, res) => {
  // Permission: Chỉ cho phép lecturer xem dashboard của chính mình
  if (!req.user || req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
  }
  const lecturerId = req.user.id;   // Luôn dùng id từ token, bỏ qua query param

  try {
    const stats = await dashboardService.getLecturerDashboard(lecturerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};
exports.getRiskFlags = async (req, res) => {
  // Permission: Chỉ cho phép lecturer xem rủi ro của chính mình
  if (!req.user || req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
  }
  const lecturerId = req.user.id;

  try {
    const risks = await dashboardService.getRiskFlags(lecturerId);
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};