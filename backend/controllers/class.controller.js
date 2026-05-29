const { poolPromise, sql } = require("../config/db");
const classService = require("../services/class.service");
const auditService = require("../services/audit.service");

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

exports.createClass = async (req, res) => {
  try {
    console.log(">>> Dữ liệu Frontend gửi lên để tạo lớp:", req.body);
    const affected = await classService.createClass(req.body);
    await auditService.logAction({
      actor_id: req.user ? req.user.id : null,
      actor_name: req.user ? req.user.name : "Admin Tổng",
      action: "CREATE",
      target_table: "Classes",
      target_id: affected, 
      old_value: null,
      new_value: req.body, 
      ip_address: req.ip,
    });
    res
      .status(201)
      .json({ message: "Tạo lớp học phần mới thành công!", affected });
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

exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

  try {
    const affected = await classService.deleteClassIfNoStudents(id);

    if (affected === 0) {
      return res.status(404).json({
        message:
          "Không tìm thấy lớp học hoặc lớp đã có sinh viên không thể xóa",
      });
    }

    await auditService.logAction({
      actor_id: req.user ? req.user.id : null,
      actor_name: req.user ? req.user.name : "Admin Tổng",
      action: "DELETE",
      target_table: "Classes",
      target_id: id,
      old_value: { message: `Xóa lớp học phần có ID là ${id}` },
      new_value: null,
      ip_address: req.ip,
    });

    res.json({ message: "Xóa lớp tín chỉ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa lớp", error: err.message });
  }
};
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
