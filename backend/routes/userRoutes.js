// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

// SỬA Ở ĐÂY: Thay vì router.get("/api/users"), hãy dùng:
router.get("/", async (req, res) => {
  // ĐÚNG: Chỉ để dấu "/"
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, name, role FROM Users");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
