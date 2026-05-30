const bcrypt = require("bcrypt");
const sql = require("mssql");
const { poolPromise } = require("../config/db");

const getUsers = async (req, res) => {
  try {
    const { search, role } = req.query;
    const pool = await poolPromise;

    let queryStr = "SELECT id, name, email, role FROM Users WHERE 1=1";
    const request = pool.request();

    if (role && role !== "undefined" && role.trim() !== "") {
      request.input("role", sql.VarChar, role.trim());
      queryStr += " AND role = @role";
    }

    if (search && search !== "undefined" && search.trim() !== "") {
      request.input("search", sql.NVarChar, `%${search.trim()}%`);
      queryStr += " AND (name LIKE @search OR email LIKE @search)";
    }

    queryStr += " ORDER BY id DESC";
    const result = await request.query(queryStr);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi Server khi lấy danh sách người dùng",
      error: err.message,
    });
  }
};

const bulkCreateUsers = async (req, res) => {
  try {
    const usersArray = req.body;
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      for (let user of usersArray) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
          user.password || "123456",
          salt,
        );

        await transaction
          .request()
          .input("name", sql.NVarChar, user.name)
          .input("email", sql.VarChar, user.email)
          .input("role", sql.VarChar, user.role || "user")
          .input("password", sql.VarChar, hashedPassword).query(`
            IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
            INSERT INTO Users (name, email, role, password_hash, is_active) 
            VALUES (@name, @email, @role, @password, 1)
          `);
      }

      await transaction.commit();
      res.status(201).json({
        message: "Đã nạp thành công danh sách tài khoản!",
        count: usersArray.length,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi nạp dữ liệu",
      error: err.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, name)
      .input("email", sql.VarChar, email)
      .input("role", sql.VarChar, role).query(`
        UPDATE Users 
        SET name = @name, email = @email, role = @role 
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json({ message: "Cập nhật user thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Users WHERE id = @id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json({ message: "Xóa user thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, userId)
      .query("SELECT id, name, email, role FROM Users WHERE id = @id");

    const user = result.recordset[0];
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng", error: err.message });
  }
};

module.exports = {
  getUsers,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  getProfile,
};
