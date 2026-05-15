const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
router.get("/", sessionController.getSessions);
router.post("/", sessionController.createSession);
router.patch("/:id/close", sessionController.closeSession);

module.exports = router;
