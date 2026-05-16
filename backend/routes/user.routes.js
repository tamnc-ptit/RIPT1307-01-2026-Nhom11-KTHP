const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");
router.get("/", userController.getUsers);
router.post("/bulk", userController.bulkCreateUsers);
router.patch("/:id", userController.updateUser);
router.patch("/:id/role", authController.updateRole);
router.delete("/:id", userController.deleteUser);

module.exports = router;
