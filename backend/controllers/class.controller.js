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
      .input("session_id", sql.Int, session_id) // Dùng session_id thay vì semester
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

module.exports = {
  getClasses,
  createClass,
};
