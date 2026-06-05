const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_token";
const SALT_ROUNDS = 10;

// REGISTER USER
exports.register = async ({ name, email, password, role }) => {
    const pool = await poolPromise;
    email = email.toLowerCase().trim();
    // Check if email exists
    const existingUser = await pool.request()
        .input("email", sql.VarChar, email)
        .query("SELECT id FROM Users WHERE email = @email");
    if (existingUser.recordset.length > 0) {
        throw new Error("Email đã tồn tại");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Insert user
    await pool.request()
        .input("name", sql.NVarChar, name)
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, hashedPassword)
        .input("role", sql.VarChar, role || "student")
        .query(`
            INSERT INTO Users (name, email, password, role)
            VALUES (@name, @email, @password, @role)
        `);
    return { message: "Người dùng đăng ký thành c" };
};

// LOGIN USER
exports.login = async ({ email, password }) => {
    const pool = await poolPromise;
    email = email.toLowerCase().trim();
    const result = await pool.request()
        .input("email", sql.VarChar, email)
        .query(`
            SELECT id, name, email, password, role
            FROM Users
            WHERE email = @email
        `);
    const user = result.recordset[0];
    if (!user) {
        throw new Error("Email hoặc mật khẩu không hợp lệ");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Email hoặc mật khẩu không hợp lệ");
    }

    // Create JWT token
    const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
    );
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    };
};

// GET PROFILE
exports.getProfile = async (userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, userId)
        .query(`
            SELECT id, name, email, role
            FROM Users
            WHERE id = @id
        `);
    if (result.recordset.length === 0) {
        throw new Error("Không tìm thấy người dùng");
    }
    return result.recordset[0];
};

// GET ALL USERS (admin usage)
exports.getAllUsers = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .query(`
            SELECT id, name, email, role
            FROM Users
        `);

    return result.recordset;
};

// DELETE USER
exports.deleteUser = async (userId) => {
    const pool = await poolPromise;
    await pool.request()
        .input("id", sql.Int, userId)
        .query(`
            DELETE FROM Users
            WHERE id = @id
        `);
    return { message: "Xóa người dùng thành công" };
};

// UPDATE USER ROLE
exports.updateRole = async (userId, role) => {
    const pool = await poolPromise;
    await pool.request()
        .input("id", sql.Int, userId)
        .input("role", sql.VarChar, role)
        .query(`
            UPDATE Users
            SET role = @role
            WHERE id = @id
        `);
    return { message: "Cập nhật vai trò của người dùng thành công" };
};

exports.updateUserFull = async (userId, { name, email, role }) => {
    const pool = await poolPromise;
    if (email) {
        email = email.toLowerCase().trim();
    }
    await pool.request()
        .input("id", sql.Int, userId)
        .input("name", sql.NVarChar, name)
        .input("email", sql.VarChar, email)
        .input("role", sql.VarChar, role)
        .query(`
            UPDATE Users
            SET name = @name,
                email = @email,
                role = @role,
                updated_at = GETDATE()
            WHERE id = @id
        `);
    return { message: "User updated successfully" };
};