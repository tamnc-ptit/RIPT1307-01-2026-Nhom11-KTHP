const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");

router.get("/", thesisController.getAdminThesis);

module.exports = router;
