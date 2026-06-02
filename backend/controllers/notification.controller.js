const notificationService = require("../services/notification.service");

exports.listForUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const data = await notificationService.getNotificationsForUser(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy thông báo", error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    await notificationService.markAsRead(id, userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật thông báo", error: err.message });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const sender = req.user; // { id, role } gắn bởi auth middleware
 
    // Kiểm tra quyền sớm để trả lỗi rõ ràng
    if (!["admin", "lecturer"].includes(sender.role)) {
      return res.status(403).json({ message: "Không có quyền gửi thông báo" });
    }
 
    const { type, title, message, refType, refId, target } = req.body;
 
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "title không được để trống" });
    }
    if (!target || !target.audience) {
      return res.status(400).json({ message: "target.audience là bắt buộc" });
    }
 
    // Lecturer: chỉ cho phép audience hợp lệ
    if (sender.role === "lecturer") {
      const allowed = ["by_class", "by_thesis", "by_student"];
      if (!allowed.includes(target.audience)) {
        return res.status(400).json({
          message: `Lecturer chỉ được dùng audience: ${allowed.join(", ")}`,
        });
      }
    }
 
    const result = await notificationService.broadcastNotification(
      { id: sender.id, role: sender.role },
      target,
      { type, title, message, refType, refId }
    );
 
    res.status(201).json({
      success: true,
      sent: result.sent,
      message: `Đã gửi thông báo tới ${result.sent} người dùng`,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi gửi thông báo", error: err.message });
  }
};

module.exports = exports;
