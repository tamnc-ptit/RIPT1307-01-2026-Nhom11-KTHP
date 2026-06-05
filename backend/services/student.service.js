const { poolPromise, sql } = require("../config/db");

const getStudentDashboard = async (studentId) => {
  const pool = await poolPromise;
  
  // Truy vấn lấy thông tin đề tài của sinh viên
  const result = await pool.request()
    .input("studentId", sql.Int, studentId)
    .query(`
      SELECT 
        t.id AS thesisId, -- 🚀 Đã thêm lấy ID đề tài
        t.title AS thesisTitle,
        u.name AS advisorName, -- SỬA full_name THÀNH name TẠI ĐÂY
        t.status AS status
      FROM Thesis t
      LEFT JOIN Users u ON t.lecturer_id = u.id
      WHERE t.student_id = @studentId
    `);

  // Nếu sinh viên chưa có đề tài
  if (result.recordset.length === 0) {
    return {
      thesisId: null, // 🚀 Trả về null nếu chưa có
      thesisTitle: null,
      advisorName: null,
      status: "not_registered",
      systemMessage: "Bạn chưa đăng ký đề tài khóa luận. Vui lòng vào mục đăng ký.",
      supportEmail: "support@ptit.edu.vn"
    };
  }

  // Nếu sinh viên đã có đề tài
  const data = result.recordset[0];
  return {
    thesisId: data.thesisId, // 🚀 Trả về ID thật của đề tài
    thesisTitle: data.thesisTitle,
    advisorName: data.advisorName || "Đang chờ phân công",
    status: data.status || "approved",
    systemMessage: "Chào mừng bạn quay lại hệ thống Workspace!",
    supportEmail: "support@ptit.edu.vn"
  };
};

module.exports = {
  getStudentDashboard
};