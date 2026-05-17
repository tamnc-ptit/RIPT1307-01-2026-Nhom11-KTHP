const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({
      name,
      email,
      password,
      role
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message || "Đăng ký thất bại"
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({
      email,
      password
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({
      message: err.message || "Đăng nhập thất bại"
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await authService.getProfile(userId);
    res.json(profile);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Không thể lấy thông tin người dùng"
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi lấy danh sách người dùng"
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    const result = await authService.updateRole(userId, role);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Cập nhật role thất bại"
    });
  }
};

const updateUserFull = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;
    const result = await authService.updateUserFull(userId, {
      name,
      email,
      role
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Cập nhật người dùng thất bại"
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await authService.deleteUser(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Xóa người dùng thất bại"
    });
  }
};

module.exports = {register, login, getProfile, getAllUsers, updateRole, updateUserFull, deleteUser}