const { poolPromise, sql } = require("../config/db");
const ExcelJS = require("exceljs");
const milestoneService = require("./milestone.service");

exports.createMilestone = milestoneService.createMilestone;

exports.getClasses = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT * FROM Classes WHERE lecturer_id = @lecturerId");
  return result.recordset;
};

exports.getDashboardStats = async (lecturerId) => {
  const pool = await poolPromise;

  // 1. Sinh viên hướng dẫn (Thesis được giảng viên duyệt)
  const guidedRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT COUNT(*) as count FROM Thesis WHERE lecturer_id = @lecturerId AND lecturer_status = 'approved'");
  const totalStudents = guidedRes.recordset[0].count;

  // 2. Yêu cầu chờ duyệt (Thesis chờ giảng viên duyệt)
  const pendingRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query("SELECT COUNT(*) as count FROM Thesis WHERE lecturer_id = @lecturerId AND lecturer_status = 'pending'");
  const pendingApprovals = pendingRes.recordset[0].count;

  // 3. Báo cáo mới nộp (Submissions có status = 'submitted')
  const newSubmissionsRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT COUNT(s.id) as count 
      FROM Submissions s
      JOIN Milestones m ON s.milestone_id = m.id
      JOIN Thesis t ON m.thesis_id = t.id
      WHERE t.lecturer_id = @lecturerId AND s.status = 'submitted'
    `);
  const newReports = newSubmissionsRes.recordset[0].count;

  return {
    totalStudents,
    pendingApprovals,
    newReports,
    completedThesis: 0 
  };
};

exports.getRiskFlags = async (lecturerId) => {
  const pool = await poolPromise;
  
  // 1. Không hoạt động trong 30 ngày (Thesis.updated_at > 30 ngày)
  const inactiveRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT t.id, t.title, u.name as studentName, 'Không có hoạt động trong 30 ngày' as flagType
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      WHERE t.lecturer_id = @lecturerId 
        AND t.lecturer_status = 'approved' 
        AND t.updated_at < DATEADD(day, -30, GETDATE())
    `);

  // 2. Trễ hạn nộp (Milestones trễ hạn)
  const lateRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT t.id, t.title, u.name as studentName, N'Trễ hạn mốc: ' + m.title as flagType
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      JOIN Milestones m ON m.thesis_id = t.id
      WHERE t.lecturer_id = @lecturerId 
        AND m.status = 'pending' 
        AND m.deadline < GETDATE()
    `);

  return [...inactiveRes.recordset, ...lateRes.recordset];
};

exports.approveThesis = async (thesisId) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // 1. Cập nhật trạng thái duyệt của giảng viên
    const requestUpdate = new sql.Request(transaction);
    await requestUpdate
      .input("thesisId", sql.Int, thesisId)
      .query("UPDATE Thesis SET lecturer_status = 'approved', approved_at = GETDATE(), updated_at = GETDATE() WHERE id = @thesisId");
      
    // 2. Lấy class_id và lecturer_id
    const requestGet = new sql.Request(transaction);
    const getRes = await requestGet
      .input("thesisId", sql.Int, thesisId)
      .query("SELECT class_id, lecturer_id FROM Thesis WHERE id = @thesisId");
    
    if (getRes.recordset[0]) {
      const { class_id, lecturer_id } = getRes.recordset[0];
      
      // 3. Sao chép quy trình mẫu của lớp vào mốc tiến độ thực tế của đề tài
      if (class_id) {
        const requestInsert = new sql.Request(transaction);
        await requestInsert
          .input("thesisId", sql.Int, thesisId)
          .input("lecturerId", sql.Int, lecturer_id)
          .input("classId", sql.Int, class_id)
          .query(`
            INSERT INTO Milestones (thesis_id, created_by, title, description, deadline, status, created_at)
            SELECT @thesisId, @lecturerId, title, description, deadline, 'pending', GETDATE()
            FROM MilestoneTemplates
            WHERE class_id = @classId
          `);
      }
    }
    
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

exports.rejectThesis = async (thesisId, rejectReason) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, thesisId)
    .input("reason", sql.NVarChar, rejectReason)
    .query("UPDATE Thesis SET lecturer_status = 'rejected', reject_reason = @reason, updated_at = GETDATE() WHERE id = @id");
  return { success: true };
};

exports.finalizeThesis = async (thesisId, finalScore) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, thesisId)
    .input("note", sql.NVarChar, `final_score=${finalScore}`)
    .query("UPDATE Thesis SET lecturer_note = @note, updated_at = GETDATE() WHERE id = @id");
  return { success: true };
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
        t.admin_status
      FROM ClassStudents cs
      JOIN Users u ON cs.student_id = u.id
      LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
      WHERE cs.class_id = @classId
    `);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Báo cáo tiến độ lớp");

  worksheet.columns = [
    { header: "Tên Sinh Viên", key: "studentName", width: 25 },
    { header: "Tên Đề Tài", key: "topicName", width: 35 },
    { header: "Trạng thái duyệt GV", key: "lecturer_status", width: 20 },
    { header: "Trạng thái duyệt Admin", key: "admin_status", width: 20 },
    { header: "Điểm Đồ Án", key: "finalScore", width: 15 }
  ];

  result.recordset.forEach((row) => {
    let finalScore = "-";
    if (row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
      finalScore = row.lecturer_note.split("=")[1];
    }
    worksheet.addRow({
      studentName: row.studentName,
      topicName: row.topicName || "Chưa đăng ký",
      lecturer_status: row.lecturer_status || "-",
      admin_status: row.admin_status || "-",
      finalScore: finalScore
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

// --- QUY TRÌNH MẪU (MILESTONE TEMPLATES) ---

exports.getTemplates = async (classId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query("SELECT * FROM MilestoneTemplates WHERE class_id = @classId ORDER BY order_no ASC");
  return result.recordset;
};

exports.createTemplate = async (data) => {
  const { class_id, created_by, title, description, deadline, order_no } = data;
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("class_id", sql.Int, class_id)
    .input("created_by", sql.Int, created_by)
    .input("title", sql.NVarChar, title)
    .input("description", sql.NVarChar, description || null)
    .input("deadline", sql.DateTime, deadline)
    .input("order_no", sql.Int, order_no || 1)
    .query(`
      INSERT INTO MilestoneTemplates (class_id, created_by, title, description, deadline, order_no, created_at)
      OUTPUT INSERTED.*
      VALUES (@class_id, @created_by, @title, @description, @deadline, @order_no, GETDATE())
    `);
  return result.recordset[0];
};

exports.updateTemplate = async (id, data) => {
  const { class_id, title, description, deadline, order_no } = data;
  const pool = await poolPromise;
  
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .input("class_id", sql.Int, class_id || null)
    .input("title", sql.NVarChar, title || null)
    .input("description", sql.NVarChar, description || null)
    .input("deadline", sql.DateTime, deadline || null)
    .input("order_no", sql.Int, order_no || null)
    .query(`
      UPDATE MilestoneTemplates
      SET 
        class_id = ISNULL(@class_id, class_id),
        title = ISNULL(@title, title),
        description = ISNULL(@description, description),
        deadline = ISNULL(@deadline, deadline),
        order_no = ISNULL(@order_no, order_no)
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

exports.deleteTemplate = async (id) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM MilestoneTemplates WHERE id = @id");
  return { success: true };
};

exports.getClassStudents = async (classId) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        u.id AS studentId,
        u.name AS studentName,
        t.id AS thesisId,
        t.title AS topicName,
        t.lecturer_status,
        t.admin_status,
        t.lecturer_note
      FROM ClassStudents cs
      JOIN Users u ON cs.student_id = u.id
      LEFT JOIN Thesis t ON t.student_id = u.id AND t.class_id = cs.class_id
      WHERE cs.class_id = @classId
    `);
  return result.recordset.map(row => {
    let finalScore = null;
    if (row.lecturer_note && row.lecturer_note.startsWith("final_score=")) {
      finalScore = parseFloat(row.lecturer_note.split("=")[1]);
    }
    return {
      ...row,
      finalScore
    };
  });
};
