const { poolPromise, sql } = require("../config/db");
const ExcelJS = require("exceljs");
// ==================== PERMISSION HELPER ====================
exports.verifyMilestoneOwnership = async (milestoneId, lecturerId) => {
  const pool = await poolPromise;
  const res = await pool
    .request()
    .input("milestoneId", sql.Int, milestoneId)
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT m.id 
      FROM Milestones m
      JOIN Thesis t ON m.thesis_id = t.id
      WHERE m.id = @milestoneId AND t.lecturer_id = @lecturerId
    `);

  return res.recordset.length > 0;
};

exports.exportClassReport = async (classId) => {
  const pool = await poolPromise;
  
  const classRes = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("SELECT class_name FROM Classes WHERE id = @classId");
  const className = classRes.recordset[0]?.class_name || `Lớp ${classId}`;

  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        u.name AS studentName,
        t.title AS topicName,
        t.lecturer_note,
        t.lecturer_status,
        t.admin_status,
        t.final_score
      FROM ClassStudents cs
      JOIN Users u ON cs.student_id = u.id
      LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
      WHERE cs.class_id = @classId
    `);

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Tổng quan
  const summarySheet = workbook.addWorksheet("Tổng quan lớp");
  summarySheet.columns = [
    { header: "Tên Sinh Viên", key: "studentName", width: 25 },
    { header: "Tên Đề Tài", key: "topicName", width: 40 },
    { header: "Trạng thái GV", key: "lecturer_status", width: 15 },
    { header: "Trạng thái Admin", key: "admin_status", width: 15 },
    { header: "Điểm Tổng Kết", key: "finalScore", width: 15 }
  ];

  result.recordset.forEach((row) => {
    let finalScore = row.final_score ?? "-";
    if (finalScore === "-" && row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
      finalScore = row.lecturer_note.split("=")[1];
    }
    summarySheet.addRow({
      studentName: row.studentName,
      topicName: row.topicName || "Chưa đăng ký",
      lecturer_status: row.lecturer_status || "-",
      admin_status: row.admin_status || "-",
      finalScore
    });
  });

  // Sheet 2: Chi tiết từng mốc (Enhanced for #2)
  const detailSheet = workbook.addWorksheet("Chi tiết mốc tiến độ");

  detailSheet.columns = [
    { header: "Sinh Viên", key: "studentName", width: 22 },
    { header: "Đề Tài", key: "topicName", width: 35 },
    { header: "Mốc", key: "milestoneTitle", width: 30 },
    { header: "Hạn nộp", key: "deadline", width: 18 },
    { header: "Ngày nộp", key: "submitted_at", width: 18 },
    { header: "Điểm mốc", key: "score", width: 12 },
    { header: "Trạng thái mốc", key: "milestoneStatus", width: 14 }
  ];

  // Fetch all milestones + submissions for the class
  const milestonesRes = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        u.name AS studentName,
        t.title AS topicName,
        m.title AS milestoneTitle,
        m.deadline,
        s.submitted_at,
        s.score,
        m.status AS milestoneStatus
      FROM ClassStudents cs
      JOIN Users u ON cs.student_id = u.id
      LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
      LEFT JOIN Milestones m ON m.thesis_id = t.id
      LEFT JOIN Submissions s ON s.milestone_id = m.id AND s.thesis_id = t.id
      WHERE cs.class_id = @classId
      ORDER BY u.name, m.deadline
    `);

  milestonesRes.recordset.forEach((row) => {
    detailSheet.addRow({
      studentName: row.studentName,
      topicName: row.topicName || "Chưa đăng ký",
      milestoneTitle: row.milestoneTitle || "-",
      deadline: row.deadline ? new Date(row.deadline).toLocaleDateString("vi-VN") : "-",
      submitted_at: row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("vi-VN") : "-",
      score: row.score ?? "-",
      milestoneStatus: row.milestoneStatus || "-"
    });
  });

  return { workbook, className };
};

exports.getSessions = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT DISTINCT 
        s.id, 
        s.name AS sessionName, 
        c.class_name AS className, 
        s.start_date, 
        s.end_date, 
        CASE WHEN s.is_active = 1 THEN 'ACTIVE' ELSE 'CLOSED' END AS status,
        c.max_students AS max_students_per_group
      FROM Sessions s
      JOIN Classes c ON c.session_id = s.id
      WHERE c.lecturer_id = @lecturerId
      ORDER BY s.id DESC
    `);
  return result.recordset;
};

exports.createSession = async (data) => {
  const { class_id, start_date, end_date, max_students_per_group, created_by } = data;
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("class_id", sql.Int, class_id)
    .input("start_date", sql.DateTime, start_date)
    .input("end_date", sql.DateTime, end_date)
    .input("max_students", sql.Int, max_students_per_group)
    .input("created_by", sql.Int, created_by)
    .query(`
      DECLARE @className NVARCHAR(255);
      SELECT @className = class_name FROM Classes WHERE id = @class_id;

      INSERT INTO Sessions (name, start_date, end_date, is_active, created_by, created_at)
      VALUES (ISNULL(@className, 'Đợt đăng ký'), @start_date, @end_date, 1, @created_by, GETDATE());

      DECLARE @sessionId INT = SCOPE_IDENTITY();

      UPDATE Classes 
      SET session_id = @sessionId, max_students = @max_students 
      WHERE id = @class_id;

      SELECT s.*, c.class_name as className 
      FROM Sessions s 
      JOIN Classes c ON c.session_id = s.id
      WHERE s.id = @sessionId;
    `);

  return result.recordset[0];
};

exports.deleteSession = async (id) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    
    const requestUpdate = new sql.Request(transaction);
    await requestUpdate.input("id", sql.Int, id).query("UPDATE Classes SET session_id = NULL WHERE session_id = @id");
    
    const requestDelete = new sql.Request(transaction);
    await requestDelete.input("id", sql.Int, id).query("DELETE FROM Sessions WHERE id = @id");
    
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};








// ==================== NOTIFICATION HELPER (for Lecturer actions) ====================
exports.createNotification = async (data) => {
  const { user_id, type, title, message, ref_type, ref_id } = data;
  const pool = await poolPromise;

  await pool
    .request()
    .input("user_id", sql.Int, user_id)
    .input("type", sql.NVarChar, type)
    .input("title", sql.NVarChar, title)
    .input("message", sql.NVarChar, message)
    .input("ref_type", sql.NVarChar, ref_type || null)
    .input("ref_id", sql.Int, ref_id || null)
    .query(`
      INSERT INTO Notifications (user_id, type, title, message, ref_type, ref_id, is_read, created_at)
      VALUES (@user_id, @type, @title, @message, @ref_type, @ref_id, 0, GETDATE())
    `);
};



// ==================== AUDIT LOG HELPER ====================
exports.logAudit = async (data) => {
  const {
    actor_id,
    actor_name,
    action,
    target_table,
    target_id,
    old_value = null,
    new_value = null,
    ip_address = null
  } = data;

  const pool = await poolPromise;

  await pool
    .request()
    .input("actor_id", sql.Int, actor_id || null)
    .input("actor_name", sql.NVarChar, actor_name || null)
    .input("action", sql.NVarChar, action)
    .input("target_table", sql.NVarChar, target_table)
    .input("target_id", sql.Int, target_id || null)
    .input("old_value", sql.NVarChar, old_value ? JSON.stringify(old_value) : null)
    .input("new_value", sql.NVarChar, new_value ? JSON.stringify(new_value) : null)
    .input("ip_address", sql.NVarChar, ip_address || null)
    .query(`
      INSERT INTO AuditLogs (actor_id, actor_name, action, target_table, target_id, old_value, new_value, ip_address, created_at)
      VALUES (@actor_id, @actor_name, @action, @target_table, @target_id, @old_value, @new_value, @ip_address, GETDATE())
    `);
};
