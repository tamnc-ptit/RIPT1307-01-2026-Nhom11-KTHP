const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");

router.get("/admin", thesisController.getAdminThesis);

module.exports = router;