const dashboardService = require("../services/dashboard.service")
const classService = require("../services/class.service")
const lecturerService = require("../services/lecturer.service")
const { poolPromise, sql } = require("../config/db");

exports.getLecturerDashboard = async (req, res) => {
  if (!req.user || req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Chỉ giảng viên mới được truy cập" });
  }
  const lecturerId = req.user.id;

  try {
    const stats = await dashboardService.getLecturerDashboard(lecturerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};
exports.getRiskFlags = async (req, res) => {
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