const topicService = require("../services/topic.service");

exports.list = async (req, res) => {
  try {
    const filters = {
      session_id: req.query.session_id ? parseInt(req.query.session_id) : undefined,
      status: req.query.status,
      lecturerId: req.query.lecturerId ? parseInt(req.query.lecturerId) : undefined,
    };
    const data = await topicService.getAllSuggestions(filters);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách đề xuất", error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await topicService.getSuggestionById(id);
    if (!data) return res.status(404).json({ message: "Không tìm thấy đề xuất" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy đề xuất", error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để đăng ký đề tài." });
    }
    const thesis = await topicService.registerSuggestion(id, userId, req.body || {});
    res.status(201).json(thesis);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = exports;
