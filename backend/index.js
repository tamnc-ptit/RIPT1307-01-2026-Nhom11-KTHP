const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});



app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/thesis", require("./routes/thesis.routes"));
app.use("/api/milestones", require("./routes/milestone.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/lecturer", require("./routes/lecturer.routes"));
app.use("/api/topics", require("./routes/topic.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

app.use("/api/admin/thesis", require("./routes/thesis.routes"));
app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});