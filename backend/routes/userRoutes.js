const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");
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

module.exports = router;
