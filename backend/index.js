const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sql = require("mssql");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const { poolPromise } = require("./config/db");

dotenv.config();
const app = express();

// --- Cấu hình Middleware ---
app.use(cors()); // Phải đặt trên cùng để tránh lỗi "Không thể kết nối"
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// API Thesis (Đề tài)
app.get("/api/thesis", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT t.*, s.name AS student_name, l.name AS lecturer_name 
      FROM Thesis t
      LEFT JOIN Users s ON t.student_id = s.id
      LEFT JOIN Users l ON t.lecturer_id = l.id
    `);
    res.json(result.recordset);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Lỗi lấy danh sách đề tài", details: err.message });
  }
});

// Thêm đề tài mới
app.post("/api/thesis", async (req, res) => {
  const { title, description, student_id, lecturer_id } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("desc", sql.NVarChar, description)
      .input("sid", sql.Int, student_id || 1)
      .input("lid", sql.Int, lecturer_id || 1).query(`
        INSERT INTO Thesis (title, description, student_id, lecturer_id) 
        VALUES (@title, @desc, @sid, @lid)
      `);
    res.json({ success: true, message: "Thêm đề tài thành công!" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lưu đề tài", details: err.message });
  }
});

// Route kiểm tra
app.get("/", (req, res) => res.send("API đang chạy..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server ready at: http://localhost:${PORT}`);
});
