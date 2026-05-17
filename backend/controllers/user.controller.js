const { poolPromise, sql } = require("../config/db");

const getUsers = async (req, res) => {
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
    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    res.status(500).json({
      success: false, 
      message: "Lỗi lấy danh sách người dùng", 
      error: err.message 
    });
  }
};

const getUserById = async (rq, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id, name, email, role, created_at, updated_at
        FROM Users
        WHERE id = @id
      `);
      
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thông tin người dùng",
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
        await transaction
          .request()
          .input("name", sql.NVarChar, user.name)
          .input("email", sql.VarChar, user.email)
          .input("role", sql.VarChar, user.role)
          .input("password", sql.VarChar, user.password).query(`
                        IF NOT EXISTS (SELECT 1 FROM Users WHERE email = @email)
                        INSERT INTO Users (name, email, role, password_hash) 
                        VALUES (@name, @email, @role, @password)
                    `);
      }
      await transaction.commit();
      res
        .status(201)
        .json({ message: "Đã nạp thành công danh sách tài khoản!" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi khi nạp dữ liệu", error: err.message });
  }
};

const updateUser = async (req, res) => {
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
                SET name = @name, email = @email, role = @role, updated_at = GETDATE()
                WHERE id = @id
            `);

    res.json({
      success: true,
      message: "Cập nhật người dùng thành công!"
      });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật", 
      error: err.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Users WHERE id = @id");

    res.json({
      success: true,
      message: "Xóa người dùng thành công!"
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi hệ thống khi xóa",
        error: err.message
      });
  }
};

// Current logged-in user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, userId)
      .query(`
        SELECT id, name, email, role
        FROM Users
        WHERE id = @id
      `);

    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: err.message,
    });
  }
};

module.exports = { getUsers, getUserById, bulkCreateUsers, updateUser, deleteUser, getProfile };
