const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");
const auth = require("../middlewares/auth");

router.get("/", auth, thesisController.getAdminThesis);
router.post("/", auth, thesisController.createThesis);
router.put("/:id", auth, thesisController.updateThesis);
router.delete("/:id", auth, thesisController.deleteThesis);

module.exports = router;
