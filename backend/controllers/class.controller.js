<<<<<<< HEAD
const { poolPromise, sql } = require("../config/db");
const classService = require("../services/class.service")
=======
const classService = require("../services/class.service");
// Sửa lại hàm getClasses trong controllers/class.controller.js của bạn
>>>>>>> main
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

<<<<<<< HEAD
exports.createClass = async (req, res) => {
  const { class_name, course_name, session_id, lecturer_id, max_students } =
    req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("class_name", sql.NVarChar, class_name)
      .input("course_name", sql.NVarChar, course_name)
      .input("session_id", sql.Int, session_id)
      .input("lecturer_id", sql.Int, lecturer_id)
      .input("max_students", sql.Int, max_students || 30).query(`
                INSERT INTO Classes (class_name, course_name, session_id, lecturer_id, max_students)
                VALUES (@class_name, @course_name, @session_id, @lecturer_id, @max_students)
            `);
    res.status(201).json({ message: "Tạo lớp tín chỉ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi tạo lớp", error: err.message });
  }
};

exports.updateClass = async (req, res) => {
=======
exports.deleteClass = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID lớp không hợp lệ" });
  }

>>>>>>> main
  try {
    const affected = await classService.deleteClassIfNoStudents(id);

    if (affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy lớp học để xóa" });
    }

    res.json({ message: "Xóa lớp tín chỉ thành công!" });
  } catch (err) {
<<<<<<< HEAD
    res.status(500).json({ message: "Lỗi khi cập nhật lớp", error: err.message });
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
      const isOwner = classes.some(c => c.id == classId);

      if (!isOwner) {
        return res.status(403).json({ 
          message: "Bạn không có quyền xem danh sách sinh viên lớp này!" 
        });
      }
    }

    const data = await classService.getLecturerClassStudents(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

=======
    res.status(400).json({ message: err.message });
  }
};
>>>>>>> main
