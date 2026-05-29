const { poolPromise, sql } = require("../config/db");
const { Parser } = require("json2csv");

exports.exportThesisToCSV = async () => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      SELECT 
        t.id AS [Mã đề tài],
        t.title AS [Tên đề tài],
        u1.name AS [Sinh viên thực hiện],
        u2.name AS [Giảng viên hướng dẫn],
        t.lecturer_status AS [Trạng thái GV],
        t.admin_status AS [Trạng thái Admin],
        t.final_score AS [Điểm số],
        FORMAT(t.created_at, 'dd/MM/yyyy') AS [Ngày tạo]
      FROM Thesis t
      LEFT JOIN Users u1 ON t.student_id = u1.id
      LEFT JOIN Users u2 ON t.lecturer_id = u2.id
      ORDER BY t.created_at DESC;
    `);

    const data = result.recordset;

    if (data.length === 0) {
      throw new Error("Không có dữ liệu đề tài để xuất báo cáo!");
    }

    const fields = [
      "Mã đề tài", 
      "Tên đề tài", 
      "Sinh viên thực hiện", 
      "Giảng viên hướng dẫn", 
      "Trạng thái GV", 
      "Trạng thái Admin", 
      "Điểm số", 
      "Ngày tạo"
    ];
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    return "\ufeff" + csv;
  } catch (err) {
    throw new Error("Lỗi xuất file CSV: " + err.message);
  }
};