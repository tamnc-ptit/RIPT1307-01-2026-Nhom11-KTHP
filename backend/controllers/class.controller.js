const { poolPromise, sql } = require("../config/db");


const getClasses = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
            SELECT c.*, u.name as lecturer_name 
            FROM Classes c
            LEFT JOIN Users u ON c.lecturer_id = u.id
        `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
};

const createClass = async (req, res) => {
  const { class_name, course_name, semester, lecturer_id } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("class_name", sql.NVarChar, class_name)
      .input("course_name", sql.NVarChar, course_name)
      .input("semester", sql.VarChar, semester)
      .input("lecturer_id", sql.Int, lecturer_id).query(`
                INSERT INTO Classes (class_name, course_name, semester, lecturer_id)
                VALUES (@class_name, @course_name, @semester, @lecturer_id)
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
