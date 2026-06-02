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

// --- IMPORT THÊM 2 ROUTE CÒN THIẾU Ở ĐÂY ---
const userRoutes = require("./routes/user.routes"); 
const thesisRoutes = require("./routes/thesis.routes");

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/lecturer", require("./routes/lecturer.routes"));

// --- KHAI BÁO ĐƯỜNG DẪN CHO API USERS VÀ THESIS ---
app.use("/api/users", userRoutes);
app.use("/api/thesis", thesisRoutes);

app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});