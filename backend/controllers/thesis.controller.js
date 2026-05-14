const { poolPromise, sql } = require("../config/db");

const getAdminThesis = async (req, res) => {
  try {
    const { status, classId, semester } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    request.input("status", sql.NVarChar, status || null);
    request.input("classId", sql.Int, classId ? parseInt(classId) : null);
    request.input("semester", sql.NVarChar, semester || null);

    const query = `
            SELECT 
                t.id, t.title, t.lecturer_status, t.admin_status, t.created_at,
                s.name AS student_name,
                c.class_name,
                l.name AS lecturer_name
            FROM dbo.Thesis t
            LEFT JOIN dbo.Users s ON t.student_id = s.id
            LEFT JOIN dbo.Classes c ON t.class_id = c.id
            LEFT JOIN dbo.Users l ON t.lecturer_id = l.id
            WHERE 
                (@status IS NULL OR t.admin_status = @status) AND
                (@classId IS NULL OR c.id = @classId)
            ORDER BY t.created_at DESC;
        `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi kết nối cơ sở dữ liệu", error: error.message });
  }
};

module.exports = { getAdminThesis };
