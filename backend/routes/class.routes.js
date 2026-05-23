const express = require("express");
const router = express.Router();
const classController = require("../controllers/class.controller");

router.get("/", classController.getClasses);
router.post("/", classController.createClass);
router.patch("/:id", classController.updateClass);

module.exports = router;
