const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");
const userRoutes = require("./user.routes");
router.get("/", thesisController.getAdminThesis);
router.post("/", thesisController.createThesis);
router.put("/:id", thesisController.updateThesis);
router.patch("/:id", thesisController.updateThesis);
router.delete("/:id", thesisController.deleteThesis);
router.patch("/:id/review", thesisController.updateThesisReviewStatus);
if (userRoutes) {
  router.use("/users", userRoutes);
}
module.exports = router;
