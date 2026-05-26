const templateService = require("../services/template.service");
const classService = require("../services/class.service");

// --- Templates (Quy trình mẫu) ---

exports.getTemplates = async (req, res) => {
  try {
    const { classId } = req.query;
    if (classId && req.user && req.user.role === "lecturer") {
      const classes = await classService.getLecturerClasses(req.user.id);
      const isOwner = classes.some(c => c.id == classId);
      if (!isOwner) {
        return res.status(403).json({ message: "Bạn không có quyền xem quy trình mẫu của lớp này!" });
      }
    }
    const data = await templateService.getTemplates(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy Templates", error: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const data = await templateService.createTemplate(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo Template", error: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await templateService.updateTemplate(id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật Template", error: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await templateService.deleteTemplate(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa Template", error: err.message });
  }
};
