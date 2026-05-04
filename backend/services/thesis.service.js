const { poolPromise, sql } = require("../config/db");

// GET ALL
exports.getAllThesis = async (keyword) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("keyword", sql.NVarChar, keyword || null)
    .query(`
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
      WHERE @keyword IS NULL OR t.title LIKE '%' + @keyword + '%'
      ORDER BY t.id DESC
    `);

  return result.recordset;
};



// CREATE
exports.createThesis = async (data) => {
  const { title, description, student_id, lecturer_id } = data;

  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("student_id", sql.Int, student_id)
    .input("lecturer_id", sql.Int, lecturer_id || null)
    .query(`
      INSERT INTO Thesis (title, description, student_id, lecturer_id)
      OUTPUT INSERTED.*
      VALUES (@title, @description, @student_id, @lecturer_id)
    `);

  return result.recordset[0];
};



// UPDATE
exports.updateThesis = async (id, data) => {
  const { title, description, student_id, lecturer_id } = data;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("student_id", sql.Int, student_id)
    .input("lecturer_id", sql.Int, lecturer_id || null)
    .query(`
      UPDATE Thesis
      SET title = @title, description = @description, 
          student_id = @student_id, lecturer_id = @lecturer_id
      OUTPUT INSERTED.*
      WHERE id = @id;
    `);
console.log(">>> Database trả về result gốc:", result);
  console.log(">>> Dữ liệu hàng đầu tiên (recordset[0]):", result.recordset[0]);
  return result.recordset[0]; 
};



// DELETE
exports.deleteThesis = async (id) => {
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("id", sql.Int, parseInt(id)) // Ép kiểu về số nguyên ở đây
    .query(`DELETE FROM Thesis WHERE id = @id`);

  return result.rowsAffected[0];
};