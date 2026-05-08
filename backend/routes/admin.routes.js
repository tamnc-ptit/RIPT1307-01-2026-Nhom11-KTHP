const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");

// --- 1. Lấy danh sách người dùng (Read) ---
// Hỗ trợ tìm kiếm và lọc theo vai trò như giao diện FE
router.get("/users", async (req, res) => {
  try {
    const { role, search } = req.query;
    const pool = await poolPromise;
    let query = "SELECT id, name, email, role FROM Users WHERE 1=1";

    const request = pool.request();

    if (role) {
      query += " AND role = @role";
      request.input("role", sql.VarChar, role);
    }

    if (search) {
      query += " AND (name LIKE @search OR email LIKE @search)";
      request.input("search", sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách", error: err.message });
  }
});

// --- 2. Thêm hàng loạt (Bulk Create) ---
// (Giữ nguyên logic của bạn đã chạy thành công)
router.post("/users/bulk", async (req, res) => {
  try {
    const usersArray = req.body;
    const pool = await poolPromise;
    for (let user of usersArray) {
      await pool
        .request()
        .input("name", sql.NVarChar, user.name)
        .input("email", sql.VarChar, user.email)
        .input("role", sql.VarChar, user.role)
        .input("password", sql.VarChar, user.password).query(`
                    IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
                    INSERT INTO Users (name, email, role, password) 
                    VALUES (@name, @email, @role, @password)
                `);
    }
    res.status(201).json({ message: "Đã nạp thành công danh sách tài khoản!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi nạp dữ liệu", error: err.message });
  }
});

// --- 3. Cập nhật người dùng (Update) ---
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("email", sql.VarChar, email)
      .input("role", sql.VarChar, role).query(`
                UPDATE Users 
                SET name = @name, email = @email, role = @role 
                WHERE id = @id
            `);

    res.json({ message: "Cập nhật người dùng thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
  }
});

// --- 4. Xóa người dùng (Delete) ---
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // 1. Xóa tất cả các mối quan hệ của User này ở các bảng trung gian trước
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM ClassStudents WHERE student_id = @id");

    // 2. Sau khi đã "cắt đuôi" ở bảng trung gian, tiến hành xóa User
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Users WHERE id = @id");

    res.json({ message: "Xóa thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
});

// --- 2. Lấy danh sách đề tài (Admin View kèm bộ lọc) ---
router.get("/thesis", async (req, res) => {
  try {
    const { status, classId, semester } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    // Truyền tham số an toàn vào SQL (nếu không có thì gán null để khớp với logic IS NULL)
    request.input('status', sql.NVarChar, status || null);
    request.input('classId', sql.Int, classId ? parseInt(classId) : null);
    request.input('semester', sql.NVarChar, semester || null);

    const query = `
        SELECT 
            t.id, 
            t.title, 
            t.status, 
            t.created_at,
            s.name AS student_name,
            c.id AS class_id,
            c.class_name,
            c.semester,
            l.id AS lecturer_id,
            l.name AS lecturer_name
        FROM dbo.Thesis t
        LEFT JOIN dbo.Users s ON t.student_id = s.id
        LEFT JOIN dbo.Classes c ON t.class_id = c.id
        LEFT JOIN dbo.Users l ON c.lecturer_id = l.id
        WHERE 
            (@status IS NULL OR t.status = @status) AND
            (@classId IS NULL OR c.id = @classId) AND
            (@semester IS NULL OR c.semester = @semester)
        ORDER BY t.created_at DESC;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đề tài cho Admin:", error);
    res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu" });
  }
});
module.exports = router;
