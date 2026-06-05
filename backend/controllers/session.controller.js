const sessionService = require("../services/session.service");
const notificationService = require("../services/notification.service");

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

    try {
      await notificationService.broadcastNotification(
        { id: req.user?.id ?? req.body.created_by ?? null, role: "admin" },
        { audience: "all_lecturers" },
        {
          type: "session_opened",
          title: "Mở đợt đăng ký đồ án mới",
          message: `Đã mở đợt đăng ký "${data.name}" từ ${new Date(data.start_date).toLocaleDateString("vi-VN")} đến ${new Date(data.end_date).toLocaleDateString("vi-VN")}.`,
          refType: "session",
          refId: data.id,
        }
      );
    } catch (notifyErr) {
      console.error("Lỗi gửi thông báo khi tạo đợt mới:", notifyErr.message);
    }

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

    if (req.body.hasOwnProperty("is_active")) {
      try {
        const status = req.body.is_active === 1 || req.body.is_active === true ? "mở" : "đóng";
        await notificationService.broadcastNotification(
          { id: req.user?.id ?? req.body.created_by ?? null, role: "admin" },
          { audience: "all_lecturers" },
          {
            type: req.body.is_active === 1 || req.body.is_active === true ? "session_opened" : "session_closed",
            title: req.body.is_active === 1 || req.body.is_active === true ? "Đã mở lại đợt đăng ký đồ án" : "Đã đóng đợt đăng ký đồ án",
            message: `Đợt đăng ký "${data.name}" đã được ${status}.`,
            refType: "session",
            refId: data.id,
          }
        );
      } catch (notifyErr) {
        console.error("Lỗi gửi thông báo khi cập nhật đợt đồ án:", notifyErr.message);
      }
    }

    res.json({ message: "Cập nhật thành công", data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật đợt đồ án", error: err.message });
  }
};
