const { poolPromise, sql } = require("../config/db");

const getAdminThesisService = async (filters) => {
  const { admin_status, lecturer_status, class_id, classId, session_id } =
    filters;
  const finalClassId = class_id || classId;

  const pool = await poolPromise;
  const request = pool.request();

  request.input("adminStatus", sql.NVarChar, admin_status || null);
  request.input("lecturerStatus", sql.NVarChar, lecturer_status || null);
  request.input(
    "classId",
    sql.Int,
    finalClassId ? parseInt(finalClassId, 10) : null,
  );
  request.input(
    "sessionId",
    sql.Int,
    session_id ? parseInt(session_id, 10) : null,
  );

  const query = `
    SELECT 
        t.id, t.title, t.lecturer_status, t.admin_status, t.created_at,
        t.class_id, t.lecturer_id, t.session_id,
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
        (@adminStatus IS NULL OR LOWER(t.admin_status) = LOWER(@adminStatus)) AND
        (@lecturerStatus IS NULL OR LOWER(t.lecturer_status) = LOWER(@lecturerStatus)) AND
        (@classId IS NULL OR t.class_id = @classId) AND
        (@sessionId IS NULL OR t.session_id = @sessionId)
    ORDER BY t.created_at DESC;
  `;

  const result = await request.query(query);
  return result.recordset;
};

const updateThesisAssignmentService = async (id, data) => {
  const { class_id, lecturer_id } = data;

  const pool = await poolPromise;
  const request = pool.request();

  const targetId = parseInt(id, 10);
  const parsedClassId =
    class_id !== undefined && class_id !== null && class_id !== ""
      ? parseInt(class_id, 10)
      : null;
  const parsedLecturerId =
    lecturer_id !== undefined && lecturer_id !== null && lecturer_id !== ""
      ? parseInt(lecturer_id, 10)
      : null;

  request.input("id", sql.Int, targetId);
  request.input("newClassId", sql.Int, parsedClassId);
  request.input("newLecturerId", sql.Int, parsedLecturerId);

  const query = `
    UPDATE dbo.Thesis
    SET 
        class_id = COALESCE(@newClassId, class_id),
        lecturer_id = COALESCE(@newLecturerId, lecturer_id),
        updated_at = GETDATE()
    WHERE id = @id;
  `;

  const result = await request.query(query);
  return result.rowsAffected[0]; 
};

const updateThesisReviewStatusService = async (id, statusData) => {
  const { admin_status } = statusData;

  const pool = await poolPromise;
  const request = pool.request();

  request.input("id", sql.Int, parseInt(id, 10));
  request.input("adminStatus", sql.NVarChar, admin_status || null);

  const query = `
    UPDATE dbo.Thesis
    SET 
        admin_status = @adminStatus,
        approved_at = CASE WHEN LOWER(@adminStatus) = 'approved' THEN GETDATE() ELSE approved_at END,
        updated_at = GETDATE()
    WHERE id = @id;
  `;

  const result = await request.query(query);
  return result.rowsAffected[0];
};

module.exports = {
  getAdminThesisService,
  updateThesisAssignmentService,
  updateThesisReviewStatusService,
};
