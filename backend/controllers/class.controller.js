const { poolPromise, sql } = require("../config/db");

const getClasses = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
            SELECT c.*, u.name as lecturer_name, s.name as session_name
            FROM Classes c
            LEFT JOIN Users u ON c.lecturer_id = u.id
            LEFT JOIN Sessions s ON c.session_id = s.id
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

const createClass = async (req, res) => {
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
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_name, course_name, session_id, lecturer_id, max_students } =
      req.body;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("class_name", sql.NVarChar, class_name)
      .input("course_name", sql.NVarChar, course_name)
      .input("session_id", sql.Int, session_id)
      .input("lecturer_id", sql.Int, lecturer_id)
      .input("max_students", sql.Int, max_students || 30).query(`
        UPDATE Classes 
        SET class_name = @class_name, 
            course_name = @course_name, 
            session_id = @session_id, 
            lecturer_id = @lecturer_id, 
            max_students = @max_students 
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Lớp học phần không tồn tại" });
    }

    res.json({ message: "Cập nhật lớp tín chỉ thành công!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật lớp", error: err.message });
  }
};

module.exports = {
  getClasses,
  createClass,
  updateClass,
};
