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
