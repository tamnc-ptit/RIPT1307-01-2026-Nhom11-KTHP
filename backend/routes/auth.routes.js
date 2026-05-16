const express = require("express");
const router = express.Router();
// userRoutes.js
const authController = require("../controllers/auth.controller"); 
router.get("/users", authController.getAllUsers);

router.post("/register", authController.register);
router.delete("/users/:id", authController.deleteUser);
router.post("/login", authController.login);
router.patch("/users/:id/role", authController.updateRole);

module.exports = router;
