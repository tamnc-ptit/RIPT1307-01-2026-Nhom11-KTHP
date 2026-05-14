const { poolPromise, sql } = require("../config/db");

exports.getDashboardStats = async (lecturerId) => {
  const pool = await poolPromise;
  
  // Tổng số sinh viên đang hướng dẫn (Thesis có trạng thái Approved)
  // Đề tài đang chờ duyệt (Pending)
  // Bài nộp mới (Milestones có status 'submitted' và chưa có lecturer_comment)
  
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
  
  // 1. Không có cập nhật tiến độ trong 30 ngày (Dựa trên Thesis.updated_at hoặc Milestone.submitted_at)
  // 2. Trễ hạn Milestone quá 1 tuần
  
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
