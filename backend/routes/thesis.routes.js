const express = require("express");
const router = express.Router();
const thesisController = require("../controllers/thesis.controller");

router.get("/admin", thesisController.getAdminThesis);

module.exports = router;
```

    const express = require("express");
    const router = express.Router();
    const userRoutes = require("./user.routes");
    const thesisRoutes = require("./thesis.routes");

    router.use("/users", userRoutes);
    router.use("/thesis", thesisRoutes);

    module.exports = router;
    
    ```;
