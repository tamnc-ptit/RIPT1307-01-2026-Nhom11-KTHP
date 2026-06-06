const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const app = express();

// --- 1. MIDDLEWARES ---
app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "https://guileless-blancmange-410d86.netlify.app",
      "https://deploy-preview-20--guileless-blancmange-410d86.netlify.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- 2. ROUTES ---
// API dùng chung
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));

// API quản lý (Admin / Giảng viên)
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/thesis", require("./routes/thesis.routes")); // Route thêm từ nhánh main
app.use("/api/lecturer", require("./routes/lecturer.routes"));

// API Đồ án, Nộp bài, Tiến độ (Chung & Sinh viên)
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/thesis", require("./routes/thesis.routes"));
app.use("/api/milestones", require("./routes/milestone.routes"));
app.use("/api/submissions", require("./routes/submission.routes")); // Dùng tên chuẩn "submissions" (có s)
app.use("/api/progress", require("./routes/progress.routes"));

app.use("/api/topics", require("./routes/topic.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/comments", require("./routes/comment.routes"));
app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

// --- 3. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});