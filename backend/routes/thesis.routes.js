const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");
const userRoutes = require("./user.routes"); 
router.get("/admin", thesisController.getAdminThesis);
router.patch("/:id", thesisController.updateThesisAssignment);
router.patch("/:id/review", thesisController.updateThesisReviewStatus);
if (userRoutes) {
  router.use("/users", userRoutes);
}
module.exports = router;
