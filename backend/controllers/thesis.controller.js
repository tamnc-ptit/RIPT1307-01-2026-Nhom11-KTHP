const { poolPromise, sql } = require("../config/db");

const getAdminThesis = async (req, res) => {
  try {
    const { status, classId, semesterId } = req.query; 
    const pool = await poolPromise;
    const request = pool.request();

    request.input("status", sql.NVarChar, status || null);
    request.input("classId", sql.Int, classId ? parseInt(classId) : null);
    request.input(
      "semesterId",
      sql.Int,
      semesterId ? parseInt(semesterId) : null,
    );

    const query = `
            SELECT 
                t.id, t.title, t.lecturer_status, t.admin_status, t.created_at,
                s.name AS student_name,
                c.class_name,
                l.name AS lecturer_name,
                ses.name AS session_name
            FROM dbo.Thesis t
            LEFT JOIN dbo.Users s ON t.student_id = s.id
            LEFT JOIN dbo.Classes c ON t.class_id = c.id
            LEFT JOIN dbo.Users l ON t.lecturer_id = l.id
            LEFT JOIN dbo.Sessions ses ON t.session_id = ses.id
            WHERE 
                (@status IS NULL OR t.admin_status = @status) AND
                (@classId IS NULL OR c.id = @classId) AND
                (@semesterId IS NULL OR ses.id = @semesterId) -- Đã thêm bộ lọc học kỳ
            ORDER BY t.created_at DESC;
        `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi kết nối cơ sở dữ liệu", error: error.message });
  }
};

const thesisService = require("../services/thesis.service");

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

module.exports = {
  getAdminThesis,
  createThesis: exports.createThesis,
  updateThesis: exports.updateThesis,
  deleteThesis: exports.deleteThesis
};
