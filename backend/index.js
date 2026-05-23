const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();



app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});


app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/sessions", require("./routes/session.routes"));
app.use("/api/thesis", require("./routes/thesis.routes"));
app.use("/api/lecturer", require("./routes/lecturer.routes"));
app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});