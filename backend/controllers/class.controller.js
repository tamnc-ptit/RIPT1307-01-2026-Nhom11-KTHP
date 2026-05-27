const { poolPromise, sql } = require("../config/db");
const classService = require("../services/class.service");

// 1. Lấy danh sách lớp học
exports.getClasses = async (req, res) => {
  try {
    const data = await classService.getAllClasses();
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách lớp học phần", error: err.message });
  }
};

// 2. Tạo lớp học mới
exports.createClass = async (req, res) => {
  try {
    console.log(">>> Dữ liệu Frontend gửi lên để tạo lớp:", req.body);
    const affected = await classService.createClass(req.body);
    res
      .status(201)
      .json({ message: "Tạo lớp học phần mới thành công!", affected });
  } catch (err) {
    res.status(400).json({ message: "Lưu lớp thất bại!", error: err.message });
  }
};

// 3. Cập nhật thông tin lớp học
exports.updateClass = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

  try {
    const affected = await classService.updateClass(id, req.body);
    if (affected === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp học để cập nhật" });
    }
    res.json({ message: "Cập nhật lớp học phần thành công!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật lớp học", error: err.message });
  }
};

// 4. Xóa lớp học (Hàm này bị thiếu khiến router bị crash đây nè!)
exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

  try {
    // Gọi hàm xóa từ service (Tên hàm lấy theo logic cũ trong file của bạn)
    const affected = await classService.deleteClassIfNoStudents(id);

    if (affected === 0) {
      return res
        .status(404)
        .json({
          message:
            "Không tìm thấy lớp học hoặc lớp đã có sinh viên không thể xóa",
        });
    }

    res.json({ message: "Xóa lớp tín chỉ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa lớp", error: err.message });
  }
};

// 5. Lấy danh sách lớp của một giảng viên
exports.getLecturerClasses = async (req, res) => {
  try {
    let lecturerId = req.query.lecturerId;
    if (req.user && req.user.role === "lecturer") {
      lecturerId = req.user.id;
    }

    if (!lecturerId) {
      return res.status(400).json({ message: "Thiếu lecturerId" });
    }

    const data = await classService.getLecturerClasses(lecturerId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

// 6. Lấy danh sách sinh viên trong lớp của giảng viên
exports.getLecturerClassStudents = async (req, res) => {
  const { classId } = req.params;

  try {
    if (req.user && req.user.role === "lecturer") {
      const classes = await classService.getLecturerClasses(req.user.id);
      const isOwner = classes.some((c) => c.id == classId);

      if (!isOwner) {
        return res.status(403).json({
          message: "Bạn không có quyền xem danh sách sinh viên lớp này!",
        });
      }
    }

    const data = await classService.getLecturerClassStudents(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};