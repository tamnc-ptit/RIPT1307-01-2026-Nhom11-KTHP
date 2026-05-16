const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");

router.get("/users", userController.getUsers);
router.post("/users/bulk", userController.bulkCreateUsers);
router.patch("/users/:id", userController.updateUser);
router.patch("/users/:id/role", authController.updateRole);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;
