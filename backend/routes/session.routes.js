const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");

// 1. Lấy danh sách các đợt đồ án
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM Sessions ORDER BY created_at DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

// 2. Thiết lập đợt mới
router.post("/", async (req, res) => {
  const { semester, start_date, end_date } = req.body;
  try {
    const pool = await poolPromise;
    // Tự động đóng các đợt cũ khi tạo đợt mới (tùy chọn logic của Vinh)
    await pool.request().query("UPDATE Sessions SET is_active = 0");

    await pool
      .request()
      .input("semester", sql.NVarChar, semester)
      .input("start", sql.DateTime, start_date)
      .input("end", sql.DateTime, end_date).query(`
                INSERT INTO Sessions (semester, start_date, end_date, is_active)
                VALUES (@semester, @start, @end, 1)
            `);
    res.status(201).json({ message: "Thiết lập đợt đồ án mới thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi thiết lập", error: err.message });
  }
});

module.exports = router;
