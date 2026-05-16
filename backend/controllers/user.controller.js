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
    res.json(result.recordset);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách người dùng", error: err.message });
  }
};

const createUser = async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const pool = await poolPromise;

    const checkEmail = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.VarChar, email)
      .input("role", sql.VarChar, role)
      .input("password", sql.VarChar, password).query(`
        INSERT INTO Users (name, email, role, password_hash)
        VALUES (@name, @email, @role, @password)
      `);

    res.status(201).json({ message: "Tạo tài khoản người dùng thành công!" });
  } catch (err) {
    console.error("Lỗi tạo user:", err);
    res
      .status(500)
      .json({ message: "Lỗi Server khi tạo người dùng", error: err.message });
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

    res.json({ message: "Cập nhật người dùng thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
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

    res.json({ message: "Xóa người dùng thành công!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi hệ thống khi xóa", error: err.message });
  }
};
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query; // Lấy giá trị ?role=lecturer từ frontend gửi lên
    const pool = await poolPromise;

    const result = await pool.request().input("role", sql.NVarChar, role)
      .query(`
        SELECT id, name, email, role, is_active 
        FROM Users 
        WHERE role = @role AND is_active = 1
      `);

    res.json(result.recordset);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Lỗi Server khi lấy danh sách user",
        error: err.message,
      });
  }
};

module.exports = {
  getUsers,
  createUser,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  getUsersByRole
};
