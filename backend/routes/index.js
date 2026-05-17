const express = require("express");
const router = express.Router();
const userRoutes = require("./user.routes");
const thesisRoutes = require("./thesis.routes");

router.use("/users", userRoutes);
router.use("/thesis", thesisRoutes);

module.exports = router;