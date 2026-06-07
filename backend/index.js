const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:8000",
      "https://guileless-blancmange-410d86.netlify.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Cho phép các request không có origin (như Postman hoặc các công cụ test nội bộ)
      if (!origin) return callback(null, true);

      // 2. Cho phép các tên miền cố định khai báo trong mảng allowedOrigins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Sử dụng Regex để tự động chấp nhận TẤT CẢ các bản Deploy Preview từ Netlify của bạn
      if (
        /https:\/\/.*--guileless-blancmange-410d86\.netlify\.app/.test(origin)
      ) {
        return callback(null, true);
      }

      // Nếu không khớp với các điều kiện trên thì chặn lại
      return callback(new Error("Chặn bởi chính sách bảo mật CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- 2. ROUTES ---
// API dùng chung
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));

// API quản lý (Admin / Giảng viên)
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/thesis", require("./routes/thesis.routes"));
app.use("/api/lecturer", require("./routes/lecturer.routes"));

// API Đồ án, Nộp bài, Tiến độ (Chung & Sinh viên)
app.use("/api/student", require("./routes/student.routes"));
app.use("/api/thesis", require("./routes/thesis.routes"));
app.use("/api/milestones", require("./routes/milestone.routes"));
app.use("/api/submissions", require("./routes/submission.routes"));
app.use("/api/progress", require("./routes/progress.routes"));

app.use("/api/topics", require("./routes/topic.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/comments", require("./routes/comment.routes"));

app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
