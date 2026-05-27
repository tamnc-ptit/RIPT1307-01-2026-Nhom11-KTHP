const { poolPromise, sql } = require("../config/db");

exports.getAllClasses = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      c.id,
      c.class_name,
      c.course_name,
      c.max_students,
      c.description,
      c.session_id,
      c.lecturer_id,
      u.name AS lecturer_name -- Lấy tên giảng viên từ bảng Users để khớp với dataIndex Frontend
    FROM Classes c
    LEFT JOIN Users u ON c.lecturer_id = u.id
    ORDER BY c.created_at DESC;
  `);
  return result.recordset;
};

exports.deleteClassIfNoStudents = async (classId) => {
  const pool = await poolPromise;

  const checkStudents = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(
      "SELECT COUNT(*) AS studentCount FROM ClassStudents WHERE class_id = @classId",
    );

  const studentCount = checkStudents.recordset[0].studentCount;

  if (studentCount > 0) {
    throw new Error("Không thể xóa lớp vì đã có sinh viên tham gia học!");
  }

  await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("DELETE FROM MilestoneTemplates WHERE class_id = @classId");

  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("DELETE FROM Classes WHERE id = @classId");

  return result.rowsAffected[0];
};
exports.updateClass = async (classId, classData) => {
  const pool = await poolPromise;
  const {
    class_name,
    course_name,
    session_id,
    lecturer_id,
    max_students,
    description,
  } = classData;

  const result = await pool
    .request()
    .input("id", sql.Int, classId)
    .input("className", sql.NVarChar, class_name)
    .input("courseName", sql.NVarChar, course_name)
    .input("sessionId", sql.Int, session_id)
    .input("lecturerId", sql.Int, lecturer_id)
    .input("maxStudents", sql.Int, max_students)
    .input("description", sql.NVarChar, description || null).query(`
      UPDATE Classes 
      SET 
        class_name = @className, 
        course_name = @courseName, 
        session_id = @sessionId, 
        lecturer_id = @lecturerId, 
        max_students = @maxStudents,
        description = @description
      WHERE id = @id
    `);

  return result.rowsAffected[0];
};
exports.createClass = async (classData) => {
  const pool = await poolPromise;

  const {
    class_name,
    course_name,
    session_id,
    lecturer_id,
    max_students,
    description,
  } = classData;

  const result = await pool
    .request()
    .input("className", sql.NVarChar, class_name)
    .input("courseName", sql.NVarChar, course_name)
    .input("sessionId", sql.Int, session_id)
    .input("lecturerId", sql.Int, lecturer_id)
    .input("maxStudents", sql.Int, max_students)
    .input("description", sql.NVarChar, description || null).query(`
      INSERT INTO Classes (session_id, class_name, course_name, lecturer_id, max_students, description, created_at)
      VALUES (@sessionId, @className, @courseName, @lecturerId, @maxStudents, @description, GETDATE());
    `);

  return result.rowsAffected[0];
};
