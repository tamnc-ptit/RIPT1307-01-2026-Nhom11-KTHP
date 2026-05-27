// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");
const auditController = require("../controllers/audit.controller");
const exportController = require("../controllers/export.controller");
const importController = require("../controllers/import.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });



router.post(
  "/import/students",
  upload.single("file"),
  importController.importStudents,
);
router.get("/users", userController.getUsers);
router.post("/users/bulk", userController.bulkCreateUsers);
router.patch("/users/:id", userController.updateUser);
router.get("/audit-logs", auditController.getLogs);
router.patch("/users/:id/role", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.get("/export/thesis", exportController.downloadThesisReport);
router.get(
  "/import/students/template",
  exportController.downloadStudentTemplate,
);


router.use("/classes", require("./class.routes"));
router.use("/sessions", require("./session.routes"));
router.use("/thesis", require("./thesis.routes"));

module.exports = router;
