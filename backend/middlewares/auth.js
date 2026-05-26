const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // 1. Log xem Header có gì
  console.log("--- AUTH DEBUG ---");
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth failed: Missing or invalid format.");
    return res.status(401).json({ message: "Không có quyền truy cập! Thiếu Token xác thực." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 2. Log dữ liệu sau khi giải mã (Đây là cái quan trọng nhất!)
    console.log("Decoded Token Payload:", decoded); 
    
    req.user = decoded; // Gán vào req.user
    console.log("req.user has been set for route:", req.url);
    console.log("------------------");
    
    next();
  } catch (err) {
    console.log("Auth failed: Token expired or invalid signature.");
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!", error: err.message });
  }
};