const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);

router.post("/login", authController.login);
router.patch("/users/:id/role", authController.updateRole);


module.exports = router;
