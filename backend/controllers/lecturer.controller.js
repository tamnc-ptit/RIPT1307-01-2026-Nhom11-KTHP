const lecturerService = require("../services/lecturer.service");

exports.getDashboardStats = async (req, res) => {
  const { lecturerId } = req.query; // Tạm thời lấy qua query, sau này nên lấy từ token
  if (!lecturerId) return res.status(400).json({ message: "Thiếu lecturerId" });

  try {
    const stats = await lecturerService.getDashboardStats(lecturerId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.getRiskFlags = async (req, res) => {
  const { lecturerId } = req.query;
  if (!lecturerId) return res.status(400).json({ message: "Thiếu lecturerId" });

  try {
    const risks = await lecturerService.getRiskFlags(lecturerId);
    res.json(risks);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};
