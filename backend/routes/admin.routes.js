// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");


router.get("/users", userController.getUsers);
router.post("/users/bulk", userController.bulkCreateUsers);
router.patch("/users/:id", userController.updateUser);


router.patch("/users/:id/role", userController.updateUser);

router.delete("/users/:id", userController.deleteUser);


router.use("/classes", require("./class.routes"));
router.use("/sessions", require("./session.routes"));
router.use("/thesis", require("./thesis.routes"));

module.exports = router;
