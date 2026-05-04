const express = require("express");
const router = express.Router();
const controller = require("../controllers/thesis.controller");

router.get("/", controller.getAllThesis);
router.post("/", controller.createThesis);
router.put("/:id", controller.updateThesis);
router.delete("/:id", controller.deleteThesis);

module.exports = router;