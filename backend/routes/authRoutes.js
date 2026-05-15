const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/users", authController.getAllUsers);

router.post("/register", authController.register);
router.delete("/users/:id", authController.deleteUser);
router.post("/login", authController.login);
router.patch("/users/:id/role", authController.updateRole);

module.exports = router;
