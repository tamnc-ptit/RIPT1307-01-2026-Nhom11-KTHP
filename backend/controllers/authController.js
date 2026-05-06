const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const pool = await poolPromise;

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
      .input("password", sql.NVarChar, hashedPassword)
      .input("role", sql.NVarChar, role || "student").query(`
        INSERT INTO Users (name, email, password, role)
        VALUES (@name, @email, @password, @role)
      `);

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng ký", error: err.message });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;


  const isStudent = email.endsWith("@student.ptit.edu.vn");
  const isLecturer = email.endsWith("@ptit.edu.vn") && !isStudent;
  const isAdmin = email.endsWith("@admin.ptit.edu.vn");

  if (!isStudent && !isLecturer && !isAdmin) {
    return res.status(403).json({ 
      message: "Vui lòng sử dụng Email do Học viện cấp để đăng nhập!" 
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    const user = result.recordset[0];


    if (!user) {
      return res.status(404).json({ 
        message: "Tài khoản không tồn tại trên hệ thống. Vui lòng liên hệ Admin." 
      });
    }


    if (user.password !== password) {
      return res.status(401).json({ message: "Sai mật khẩu!" });
    }

    res.json({
      id: user.id,
      name: user.name,
      role: user.role, 
      email: user.email
    });

  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
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
      .query("UPDATE Users SET role = @role WHERE id = @id");

    res.json({ message: "Cập nhật vai trò thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, name, email, role FROM Users");
    console.log("Dữ liệu từ DB:", result.recordset);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: "Lỗi", error: err.message });
  }
};
