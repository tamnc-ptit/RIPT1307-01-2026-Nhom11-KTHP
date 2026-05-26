const classService = require("../services/class.service");
// Sửa lại hàm getClasses trong controllers/class.controller.js của bạn
exports.getClasses = async (req, res) => {
  try {
    // 🛠️ Gọi chính xác hàm getAllClasses từ tầng service vừa thêm
    const data = await classService.getAllClasses(); 
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách lớp học phần", error: err.message });
  }
};
exports.createClass = async (req, res) => {
  try {
    console.log(">>> Dữ liệu Frontend gửi lên để tạo lớp:", req.body);
        const affected = await classService.createClass(req.body);
    
    res.status(201).json({ message: "Tạo lớp học phần mới thành công!", affected });
  } catch (err) {
    res.status(400).json({ message: "Lưu lớp thất bại!", error: err.message });
  }
};
exports.updateClass = async (req, res) => {
  const { id } = req.params;
  
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

  try {
    const affected = await classService.updateClass(id, req.body);
    
    if (affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy lớp học để cập nhật" });
    }
    
    res.json({ message: "Cập nhật lớp học phần thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật lớp học", error: err.message });
  }
};

exports.deleteClass = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

  try {
    const affected = await classService.deleteClassIfNoStudents(id);

    if (affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy lớp học để xóa" });
    }

    res.json({ message: "Xóa lớp tín chỉ thành công!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
