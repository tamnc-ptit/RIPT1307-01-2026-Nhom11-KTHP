const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");
const authController = require("../controllers/authController");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, name, email, role FROM Users");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get("/users", authController.getAllUsers);
router.patch("/:id/role", authController.updateRole);

// Route tạo người dùng mới
router.post("/", async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const pool = await poolPromise; // Đảm bảo đã import poolPromise từ config db

    // 1. (Tùy chọn) Kiểm tra email đã tồn tại chưa
    const checkEmail = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // 2. Thêm người dùng mới vào DB
    // Lưu ý: Trong thực tế nên hash password bằng bcrypt trước khi lưu
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("role", sql.NVarChar, role)
      .input("password", sql.NVarChar, password) // Nên hash chỗ này
      .query(`
        INSERT INTO Users (name, email, role, password)
        VALUES (@name, @email, @role, @password)
      `);

    res.status(201).json({ message: "Tạo tài khoản người dùng thành công!" });
  } catch (err) {
    console.error("Lỗi tạo user:", err);
    res.status(500).json({ message: "Lỗi Server khi tạo người dùng", error: err.message });
  }
});

module.exports = router;
