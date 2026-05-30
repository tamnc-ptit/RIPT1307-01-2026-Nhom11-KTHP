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
      u.name AS lecturer_name,
      COUNT(cs.student_id) AS current_students
    FROM Classes c
    LEFT JOIN Users u ON c.lecturer_id = u.id
    LEFT JOIN ClassStudents cs ON c.id = cs.class_id    GROUP BY 
      c.id, 
      c.class_name, 
      c.course_name, 
      c.max_students, 
      c.description, 
      c.session_id, 
      c.lecturer_id, 
      u.name,
      c.created_at
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
exports.getLecturerClasses = async (lecturerId) => {
   try {
     const pool = await poolPromise;
     const result = await pool
       .request()
       .input("lecturerId", sql.Int, lecturerId)
       .query(`
         SELECT * FROM Classes 
         WHERE lecturer_id = @lecturerId
       `);
     return result.recordset; 
   } catch (err) {
     throw new Error("Lỗi truy vấn lấy lớp của giảng viên: " + err.message);
   }
};

exports.getLecturerClassStudents = async (classId) => {
   const pool = await poolPromise;
   const result = await pool
     .request()
     .input("classId", sql.Int, classId)
     .query(`
       SELECT 
         u.id AS id,
         u.id AS studentId,
         u.name AS name,
         u.name AS studentName,
         u.email,
         u.role,
         t.id AS thesisId,
         t.title AS topicName,
         t.lecturer_status,
         t.admin_status,
         t.lecturer_note,
         t.final_score
       FROM ClassStudents cs
       JOIN Users u ON cs.student_id = u.id
       LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
       WHERE cs.class_id = @classId
     `);

   return result.recordset.map(row => {
     let finalScore = row.final_score ?? null;
     if (finalScore === null && row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
       finalScore = parseFloat(row.lecturer_note.split("=")[1]);
     }
     return {
       ...row,
       finalScore
     };
   });
};