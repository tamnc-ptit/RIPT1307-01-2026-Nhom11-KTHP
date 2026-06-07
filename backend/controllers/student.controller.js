// Thêm vào cuối file student.controller.js

// Lấy danh sách giảng viên cho student chọn
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

// Lấy danh sách đề tài gợi ý (open)
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

// Sinh viên nộp phiếu đăng ký đề tài
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
    const student_id = req.user.id; // Lấy từ token, không tin req.body

    const pool = await poolPromise;

    // Kiểm tra sinh viên đã có đề tài chưa
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

module.exports = {
  getStudentDashboard,
  getProfile,
  updateProfile,
  getLecturers, // ✅ export mới
  getSuggestedTopics, // ✅ export mới
  submitRegistration, // ✅ export mới
};
