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

module.exports = exports;
