const sessionService = require("../services/session.service");

// Tạo đợt mới
exports.createSession = async (req, res) => {
  const { name, start_date, end_date } = req.body;

  // Validate nhanh dữ liệu đầu vào chống lỗi NULL
  if (!name || !start_date || !end_date) {
    return res.status(400).json({
      message:
        "Thiếu thông tin bắt buộc! Vui lòng nhập đầy đủ tên đợt và thời gian.",
    });
  }

  try {
    console.log(">>> Backend nhận dữ liệu thiết lập đợt mới:", req.body);

    const data = await sessionService.createSession(req.body);
    res.status(201).json({ message: "Kích hoạt đợt mới thành công!", data });
  } catch (err) {
    res.status(500).json({ message: "Lỗi thiết lập", error: err.message });
  }
};

// Lấy toàn bộ danh sách đợt
exports.getSessions = async (req, res) => {
  try {
    const data = await sessionService.getAllSessions();
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách đợt đồ án", error: err.message });
  }
};

// Cập nhật đợt
exports.updateSession = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const data = await sessionService.updateSession(id, req.body);
    if (!data)
      return res.status(404).json({ message: "Không tìm thấy đợt đồ án" });

    res.json({ message: "Cập nhật thành công", data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật đợt đồ án", error: err.message });
  }
};
