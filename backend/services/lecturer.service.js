const { poolPromise, sql } = require("../config/db");

exports.getDashboardStats = async (lecturerId) => {
  const pool = await poolPromise;
  

  
  const result = await pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT 
        (SELECT COUNT(*) FROM Thesis WHERE lecturer_id = @lecturerId AND status = 'Approved') as totalStudents,
        (SELECT COUNT(*) FROM Thesis WHERE lecturer_id = @lecturerId AND status = 'Pending') as pendingTheses,
        (SELECT COUNT(*) FROM Milestones m 
         JOIN Thesis t ON m.thesis_id = t.id 
         WHERE t.lecturer_id = @lecturerId AND m.status = 'submitted' AND m.lecturer_comment IS NULL) as newSubmissions
    `);
    
  return result.recordset[0];
};

exports.getRiskFlags = async (lecturerId) => {
  const pool = await poolPromise;
  

  
  const risks = await pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      -- Sinh viên không cập nhật trong 30 ngày
      SELECT 
        u.id as studentId,
        u.name as studentName,
        'No activity for 30 days' as riskType,
        t.updated_at as lastUpdate
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      WHERE t.lecturer_id = @lecturerId 
      AND t.status = 'Approved'
      AND DATEDIFF(day, t.updated_at, GETDATE()) > 30
      
      UNION ALL
      
      -- Sinh viên trễ hạn Milestone quá 1 tuần
      SELECT 
        u.id as studentId,
        u.name as studentName,
        'Late Milestone: ' + m.name as riskType,
        NULL as lastUpdate
      FROM Milestones m
      JOIN Thesis t ON m.thesis_id = t.id
      JOIN Users u ON t.student_id = u.id
      WHERE t.lecturer_id = @lecturerId
      AND m.status = 'todo'
      AND DATEDIFF(day, m.deadline, GETDATE()) > 7
    `);
    
  return risks.recordset;
};

exports.getClasses = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM Thesis t WHERE t.class_id = c.id) as studentCount
      FROM Classes c 
      WHERE c.lecturer_id = @lecturerId
    `);
  return result.recordset;
};

exports.approveThesis = async (thesisId) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // 1. Cập nhật trạng thái Thesis
    const thesisResult = await transaction.request()
      .input("id", sql.Int, thesisId)
      .query(`
        UPDATE Thesis 
        SET status = 'Approved', updated_at = GETDATE() 
        OUTPUT INSERTED.class_id
        WHERE id = @id
      `);
      
    const classId = thesisResult.recordset[0]?.class_id;
    
    if (classId) {
      // 2. Lấy templates của lớp này
      const templatesResult = await transaction.request()
        .input("classId", sql.Int, classId)
        .query("SELECT * FROM MilestoneTemplates WHERE class_id = @classId");
        
      const templates = templatesResult.recordset;
      
      // 3. Sinh Milestones thực tế
      for (const tmpl of templates) {
        await transaction.request()
          .input("thesisId", sql.Int, thesisId)
          .input("name", sql.NVarChar, tmpl.name)
          .input("desc", sql.NVarChar, tmpl.description)
          .input("isMandatory", sql.Bit, tmpl.is_mandatory)
          .input("reqPlagiarism", sql.Bit, tmpl.requires_plagiarism_check)
          .input("deadline", sql.DateTime, new Date(Date.now() + tmpl.relative_deadline_days * 24 * 60 * 60 * 1000))
          .query(`
            INSERT INTO Milestones (thesis_id, name, description, deadline, is_mandatory, requires_plagiarism_check, status)
            VALUES (@thesisId, @name, @desc, @deadline, @isMandatory, @reqPlagiarism, 'todo')
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

exports.rejectThesis = async (thesisId, reason) => {
  const pool = await poolPromise;
  await pool.request()
    .input("id", sql.Int, thesisId)
    .input("reason", sql.NVarChar, reason)
    .query(`
      UPDATE Thesis 
      SET status = 'Rejected', reject_reason = @reason, updated_at = GETDATE() 
      WHERE id = @id
    `);
  return { success: true };
};

const ExcelJS = require('exceljs');

exports.finalizeThesis = async (thesisId, finalScore) => {
  const pool = await poolPromise;
  await pool.request()
    .input("id", sql.Int, thesisId)
    .input("score", sql.Decimal(4, 2), finalScore)
    .query(`
      UPDATE Thesis 
      SET status = 'Completed', final_score = @score, updated_at = GETDATE() 
      WHERE id = @id
    `);
  return { success: true };
};

exports.exportClassReport = async (classId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("classId", sql.Int, classId)
    .query(`
      SELECT 
        u.id as StudentID,
        u.name as StudentName,
        t.title as ThesisTitle,
        t.final_score as FinalScore,
        t.status as Status
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      WHERE t.class_id = @classId
    `);
    
  const data = result.recordset;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Báo cáo điểm');
  
  worksheet.columns = [
    { header: 'MSSV', key: 'StudentID', width: 15 },
    { header: 'Họ tên', key: 'StudentName', width: 30 },
    { header: 'Tên đề tài', key: 'ThesisTitle', width: 50 },
    { header: 'Điểm tổng kết', key: 'FinalScore', width: 15 },
    { header: 'Trạng thái', key: 'Status', width: 15 },
  ];
  
  data.forEach(item => worksheet.addRow(item));
  
  return workbook;
};

// --- Session Configs ---
exports.getSessions = async (lecturerId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT s.*, c.class_name as className 
      FROM SessionConfigs s
      JOIN Classes c ON s.class_id = c.id
      WHERE c.lecturer_id = @lecturerId
      ORDER BY s.id DESC
    `);
  return result.recordset;
};

exports.createSession = async (data) => {
  const pool = await poolPromise;
  const { class_id, start_date, end_date, max_students_per_group } = data;
  const result = await pool.request()
    .input("class_id", sql.Int, class_id)
    .input("start_date", sql.DateTime, new Date(start_date))
    .input("end_date", sql.DateTime, new Date(end_date))
    .input("max", sql.Int, max_students_per_group)
    .query(`
      INSERT INTO SessionConfigs (class_id, start_date, end_date, max_students_per_group)
      OUTPUT INSERTED.*
      VALUES (@class_id, @start_date, @end_date, @max)
    `);
  return result.recordset[0];
};

exports.deleteSession = async (id) => {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, id).query(`DELETE FROM SessionConfigs WHERE id = @id`);
  return { success: true };
};

exports.getTemplates = async (classId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("classId", sql.Int, classId)
    .query(`SELECT * FROM MilestoneTemplates WHERE class_id = @classId ORDER BY id ASC`);
  return result.recordset;
};

exports.createTemplate = async (data) => {
  const pool = await poolPromise;
  const { class_id, name, description, is_mandatory, requires_plagiarism_check, relative_deadline_days } = data;
  const result = await pool.request()
    .input("class_id", sql.Int, class_id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description || '')
    .input("is_mandatory", sql.Bit, is_mandatory !== undefined ? is_mandatory : 1)
    .input("requires_plagiarism_check", sql.Bit, requires_plagiarism_check !== undefined ? requires_plagiarism_check : 0)
    .input("relative_deadline_days", sql.Int, relative_deadline_days)
    .query(`
      INSERT INTO MilestoneTemplates (class_id, name, description, is_mandatory, requires_plagiarism_check, relative_deadline_days)
      OUTPUT INSERTED.*
      VALUES (@class_id, @name, @description, @is_mandatory, @requires_plagiarism_check, @relative_deadline_days)
    `);
  return result.recordset[0];
};

exports.updateTemplate = async (id, data) => {
  const pool = await poolPromise;
  const { name, description, is_mandatory, requires_plagiarism_check, relative_deadline_days } = data;
  const result = await pool.request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description || '')
    .input("is_mandatory", sql.Bit, is_mandatory)
    .input("requires_plagiarism_check", sql.Bit, requires_plagiarism_check)
    .input("relative_deadline_days", sql.Int, relative_deadline_days)
    .query(`
      UPDATE MilestoneTemplates 
      SET name = @name, description = @description, is_mandatory = @is_mandatory, 
          requires_plagiarism_check = @requires_plagiarism_check, relative_deadline_days = @relative_deadline_days
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  return result.recordset[0];
};

exports.deleteTemplate = async (id) => {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, id).query(`DELETE FROM MilestoneTemplates WHERE id = @id`);
  return { success: true };
};

// --- Custom Milestones ---
exports.createMilestone = async (data) => {
  const pool = await poolPromise;
  const { thesis_id, name, description, deadline, is_mandatory, requires_plagiarism_check } = data;
  const result = await pool.request()
    .input("thesis_id", sql.Int, thesis_id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description || '')
    .input("deadline", sql.DateTime, new Date(deadline))
    .input("is_mandatory", sql.Bit, is_mandatory !== undefined ? is_mandatory : 1)
    .input("requires_plagiarism_check", sql.Bit, requires_plagiarism_check !== undefined ? requires_plagiarism_check : 0)
    .query(`
      INSERT INTO Milestones (thesis_id, name, description, deadline, is_mandatory, requires_plagiarism_check, status)
      OUTPUT INSERTED.*
      VALUES (@thesis_id, @name, @description, @deadline, @is_mandatory, @requires_plagiarism_check, 'todo')
    `);
  return result.recordset[0];
};
