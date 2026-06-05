const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors({
  origin: 'http://localhost:8000',
  credentials: true
}));
app.use(express.json());

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- 2. ROUTES ---
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/lecturer", require("./routes/lecturer.routes"));
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/thesis", require("./routes/thesis.routes"));
app.use("/api/progress", require("./routes/progress.routes"));
app.use("/api/submission", require("./routes/submission.routes"));

app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

// --- 3. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});