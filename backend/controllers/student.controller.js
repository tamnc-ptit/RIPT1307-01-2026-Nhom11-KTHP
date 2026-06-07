const studentService = require("../services/student.service");
const { poolPromise, sql } = require("../config/db");

// =========================================================================
// 1. CÁC HÀM ĐIỀU HƯỚNG CŨ (Gọi trực tiếp từ student.service.js sang)
// =========================================================================

const getStudentDashboard = async (req, res) => {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ message: "Chỉ sinh viên mới được truy cập" });
  }
  const studentId = req.user.id;
  try {
    const data = await studentService.getStudentDashboard(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy dữ liệu Dashboard", error: err.message });
  }
};

const getProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
  try {
    const profile = await studentService.getProfile(userId);
    if (!profile)
      return res.status(404).json({ message: "Không tìm thấy thông tin" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
  try {
    await studentService.updateProfile(userId, req.body);
    res.json({ message: "Cập nhật hồ sơ thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

// =========================================================================
// 2. CÁC HÀM MỚI THÊM (Tương tác trực tiếp với Database cho việc đăng ký đề tài)
// =========================================================================

const getLecturers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.id, u.name, u.email,
             up.phone, up.degree, up.domain
      FROM Users u
      LEFT JOIN UserProfiles up ON u.id = up.user_id
      WHERE u.role = 'lecturer'
      ORDER BY u.name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSuggestedTopics = async (req, res) => {
  try {
    const { lecturerId, status = "open" } = req.query;
    const pool = await poolPromise;
    const request = pool.request().input("status", sql.NVarChar, status);

    let query = `
      SELECT ts.*, u.name AS lecturer_name
      FROM TopicSuggestions ts
      LEFT JOIN Users u ON ts.lecturer_id = u.id
      WHERE ts.status = @status
    `;

    if (lecturerId) {
      request.input("lecturerId", sql.Int, parseInt(lecturerId));
      query += ` AND ts.lecturer_id = @lecturerId`;
    }

    query += ` ORDER BY ts.created_at DESC`;
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const submitRegistration = async (req, res) => {
  try {
    const {
      title,
      description,
      domain,
      lecturer_id,
      suggestion_id,
      session_id,
    } = req.body;
    const student_id = req.user.id;

    const pool = await poolPromise;

    const existing = await pool
      .request()
      .input("studentId", sql.Int, student_id)
      .query(`SELECT id FROM Thesis WHERE student_id = @studentId`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({ error: "Bạn đã đăng ký đề tài rồi" });
    }

    await pool
      .request()
      .input("studentId", sql.Int, student_id)
      .input("lecturerId", sql.Int, lecturer_id)
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description || "")
      .input("domain", sql.NVarChar, domain || "")
      .input("suggestionId", sql.Int, suggestion_id || null)
      .input("sessionId", sql.Int, session_id || null).query(`
        INSERT INTO Thesis 
          (student_id, lecturer_id, title, description, domain, 
           suggestion_id, session_id, lecturer_status, admin_status, created_at)
        VALUES 
          (@studentId, @lecturerId, @title, @description, @domain,
           @suggestionId, @sessionId, 'pending', 'pending', GETDATE())
      `);

    res.json({ success: true, message: "Đăng ký đề tài thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================================
// 3. EXPORT TẬP TRUNG - KHỚP 100% VỚI FILE STUDENT.ROUTES.JS
// =========================================================================
module.exports = {
  getStudentDashboard,
  getProfile,
  updateProfile,
  getLecturers,
  getSuggestedTopics,
  submitRegistration,
};
