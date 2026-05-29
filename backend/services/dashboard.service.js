const { poolPromise, sql } = require("../config/db");
const ExcelJS = require("exceljs");

exports.getLecturerDashboard = async (lecturerId) => {
  const pool = await poolPromise;

  const guidedRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM Thesis 
      WHERE lecturer_id = @lecturerId 
        AND lecturer_status = 'approved'
    `);
  const totalStudents = guidedRes.recordset[0].count;

  const pendingRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT COUNT(*) as count 
      FROM Thesis 
      WHERE lecturer_id = @lecturerId 
        AND lecturer_status = 'pending'
    `);
  const pendingApprovals = pendingRes.recordset[0].count;

  const newSubmissionsRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT COUNT(s.id) as count 
      FROM Submissions s
      JOIN Milestones m ON s.milestone_id = m.id
      JOIN Thesis t ON m.thesis_id = t.id
      WHERE t.lecturer_id = @lecturerId 
        AND s.status = 'submitted'
    `);
  const newReports = newSubmissionsRes.recordset[0].count;

  const completedRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT COUNT(*) as count 
      FROM Thesis 
      WHERE lecturer_id = @lecturerId 
        AND lecturer_status = 'approved'
        AND (final_score IS NOT NULL OR status = 'completed')
    `);
  const completedThesis = completedRes.recordset[0].count;

  return {
    totalStudents,
    pendingApprovals,
    newReports,
    completedThesis
  };
};

exports.getRiskFlags = async (lecturerId) => {
  const pool = await poolPromise;
  
  const inactiveRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT 
        t.id as thesisId, 
        t.title, 
        u.name as studentName, 
        N'Không có hoạt động trong 30 ngày' as flagType,
        t.updated_at as lastActivity
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      WHERE t.lecturer_id = @lecturerId 
        AND t.lecturer_status = 'approved' 
        AND t.updated_at < DATEADD(day, -30, GETDATE())
    `);

  const lateRes = await pool
    .request()
    .input("lecturerId", sql.Int, lecturerId)
    .query(`
      SELECT 
        t.id as thesisId, 
        t.title, 
        u.name as studentName, 
        N'Trễ hạn mốc: ' + m.title as flagType,
        m.deadline as lastActivity
      FROM Thesis t
      JOIN Users u ON t.student_id = u.id
      JOIN Milestones m ON m.thesis_id = t.id
      WHERE t.lecturer_id = @lecturerId 
        AND t.lecturer_status = 'approved'
        AND m.status = 'pending' 
        AND m.deadline < GETDATE()
    `);

  const allRisks = [...inactiveRes.recordset, ...lateRes.recordset];
  const uniqueRisks = allRisks.reduce((acc, risk) => {
    const existing = acc.find(r => r.thesisId === risk.thesisId);
    if (!existing) {
      acc.push(risk);
    } else if (risk.flagType.includes('Trễ hạn')) {
      existing.flagType = risk.flagType;
    }
    return acc;
  }, []);

  return uniqueRisks;
};