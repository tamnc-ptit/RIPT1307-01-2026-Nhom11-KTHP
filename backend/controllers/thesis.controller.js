const thesisService = require("../services/thesis.service");

exports.getAdminThesis = async (req, res) => {
  try {
    let { keyword, lecturerId } = req.query;
    
    // Nếu người dùng là giảng viên, bắt buộc chỉ lấy đề tài thuộc lớp họ quản lý
    if (req.user && req.user.role === "lecturer") {
      lecturerId = req.user.id;
    }
    
    const data = await thesisService.getAllThesis(keyword, lecturerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.createThesis = async (req, res) => {
  const { title, student_id } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Thiếu tiêu đề đề tài bắt buộc" });
  }

  try {
    const data = await thesisService.createThesis(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateThesis = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  console.log(`>>> Backend nhận ID: ${id} (Kiểu: ${typeof id})`);
  console.log(">>> Backend nhận Body:", body);
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const data = await thesisService.updateThesis(id, body);

    if (!data) {
      return res.status(404).json({ message: "Không tìm thấy khóa luận" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi update", error: err.message });
  }
};

exports.deleteThesis = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  try {
    const affected = await thesisService.deleteThesis(id);

    if (affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy để xóa" });
    }

    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi delete", error: err.message });
  }
};
