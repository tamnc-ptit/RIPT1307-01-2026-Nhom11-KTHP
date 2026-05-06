const { poolPromise, sql } = require("../config/db");


exports.createClass = async (data) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("className", sql.NVarChar, data.class_name)
    .input("courseName", sql.NVarChar, data.course_name)
    .input("lecturerId", sql.Int, data.lecturer_id)
    .input("semester", sql.NVarChar, data.semester).query(`
      INSERT INTO Classes (class_name, course_name, lecturer_id, semester)
      OUTPUT INSERTED.*
      VALUES (@className, @courseName, @lecturerId, @semester)
    `);
  return result.recordset[0];
};

exports.createUser = async (userData) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("name", sql.NVarChar, userData.name)
    .input("email", sql.VarChar, userData.email)
    .input("role", sql.VarChar, userData.role).query(`
      INSERT INTO Users (name, email, role)
      OUTPUT INSERTED.*
      VALUES (@name, @email, @role)
    `);
  return result.recordset[0];
};
