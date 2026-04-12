// controllers/thesisController.js
const { poolPromise, sql } = require("../config/db");

exports.getAllThesis = async (req, res) => {
  const { keyword } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("keyword", sql.NVarChar, keyword || null).query(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.student_id,
          t.lecturer_id, 
          s.name AS student_name, 
          l.name AS lecturer_name 
        FROM Thesis t
        LEFT JOIN Users s ON t.student_id = s.id
        LEFT JOIN Users l ON t.lecturer_id = l.id
        WHERE (@keyword IS NULL OR t.title LIKE '%' + @keyword + '%')
        ORDER BY t.id DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

exports.createThesis = async (req, res) => {
  const { title, description, student_id, lecturer_id } = req.body;

  if (!title || !student_id) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  try {
    const pool = await poolPromise;

    const checkStudent = await pool
      .request()
      .input("sid", sql.Int, student_id)
      .query("SELECT id FROM Users WHERE id=@sid");

    if (checkStudent.recordset.length === 0) {
      return res.status(400).json({ message: "Student không tồn tại" });
    }

    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("desc", sql.NVarChar, description || null)
      .input("sid", sql.Int, student_id)
      .input("lid", sql.Int, lecturer_id || null).query(`
        INSERT INTO Thesis (title, description, student_id, lecturer_id)
        OUTPUT INSERTED.*
        VALUES (@title, @desc, @sid, @lid)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lưu", error: err.message });
  }
};
exports.updateThesis = async (req, res) => {
  const { id } = req.params; 

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }

  const { title, description, student_id, lecturer_id } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("title", sql.NVarChar, title || null) 
      .input("desc", sql.NVarChar, description || null)
      .input("sid", sql.Int, student_id || null)
      .input("lid", sql.Int, lecturer_id || null).query(`
        UPDATE Thesis
        SET 
          title = COALESCE(@title, title),
          description = COALESCE(@desc, description),
          student_id = COALESCE(@sid, student_id),
          lecturer_id = COALESCE(@lid, lecturer_id)
        OUTPUT INSERTED.*
        WHERE id=@id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy khóa luận" });
    }

    res.json(result.recordset[0]);
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
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Thesis WHERE id=@id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy để xóa" });
    }

    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi delete", error: err.message });
  }
};
