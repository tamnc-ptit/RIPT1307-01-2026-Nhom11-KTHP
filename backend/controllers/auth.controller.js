const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log(req.body);
  console.log("password:", password);
  try {
    const pool = await poolPromise;

    // Kiểm tra email tồn tại
    const userExist = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (userExist.recordset.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("password_hash", sql.NVarChar, hashedPassword)
      .input("role", sql.NVarChar, role || "student").query(`
        INSERT INTO Users (name, email, password_hash, role, is_active)
        VALUES (@name, @email, @password_hash, @role, 1)
      `);

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng ký", error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;


  const isStudent = email.endsWith("@student.ptit.edu.vn");
  const isLecturerOrAdmin = email.endsWith("@ptit.edu.vn") && !isStudent;

  if (!isStudent && !isLecturerOrAdmin) {
    return res.status(403).json({
      message: "Vui lòng sử dụng Email Học viện cấp (@ptit.edu.vn)!",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    const user = result.recordset[0];

  
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại!" });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });
    }

  
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Sai mật khẩu!" });
    }

   
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      token: token, 
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, name, email, role, is_active FROM Users");
    res.json(result.recordset);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách người dùng", error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["student", "lecturer", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("role", sql.NVarChar, role)
      .query(
        "UPDATE Users SET role = @role, updated_at = GETDATE() WHERE id = @id",
      );

    res.json({ message: "Cập nhật vai trò thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật vai trò", error: err.message });
  }
};

exports.updateUserFull = async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;

    try {
        const pool = await poolPromise;
       
        const checkUser = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT id FROM Users WHERE id = @id");

        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng này!" });
        }

      
        await pool.request()
            .input("id", sql.Int, id)
            .input("name", sql.NVarChar, name)    
            .input("email", sql.VarChar, email)
            .input("role", sql.VarChar, role)
            .query(`
                UPDATE Users 
                SET name = @name, 
                    email = @email, 
                    role = @role 
                WHERE id = @id
            `);

        res.json({ message: "Cập nhật thông tin thành công!" });
    } catch (err) {
        console.error("Lỗi updateUserFull:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật", error: err.message });
    }
};


exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Users WHERE id = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Người dùng không tồn tại hoặc đã bị xóa trước đó." });
        }

        res.json({ message: "Xóa người dùng thành công!" });
    } catch (err) {
        console.error("Lỗi deleteUser:", err);
        if (err.number === 547) {
            return res.status(400).json({ 
                message: "Không thể xóa người dùng này vì họ đang có dữ liệu liên quan trong hệ thống!" 
            });
        }
        res.status(500).json({ message: "Lỗi hệ thống khi xóa", error: err.message });
    }
};