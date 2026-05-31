const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/session.controller");

router.get("/", sessionController.getSessions);
router.post("/", sessionController.createSession);
router.patch("/:id", sessionController.updateSession);

module.exports = router;