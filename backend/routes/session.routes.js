const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../config/db");

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

router.post("/", async (req, res) => {
  const { semester, start_date, end_date } = req.body;
  try {
    const pool = await poolPromise;
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

router.patch("/:id/close", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("UPDATE Sessions SET is_active = 0 WHERE id = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy đợt đồ án này" });
    }

    res.json({ message: "Đã đóng đợt đồ án thủ công thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi Server", error: err.message });
  }
});

module.exports = router;
