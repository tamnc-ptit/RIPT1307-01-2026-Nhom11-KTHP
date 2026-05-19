const express = require("express");
const router = express.Router();
const classController = require("../controllers/class.controller");
const auth = require("../middlewares/auth");

router.get("/", auth, classController.getClasses);
router.post("/", auth, classController.createClass);

module.exports = router;
