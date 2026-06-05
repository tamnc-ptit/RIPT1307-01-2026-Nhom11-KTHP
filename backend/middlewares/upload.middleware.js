const multer = require("multer");
const fs = require("fs");

const dir = "./public/uploads";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sanitizeFilename = (filename) => {
 
  let safeName = Buffer.from(filename, 'latin1').toString('utf8'); 
  
  safeName = safeName
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/\s+/g, "-") 
    .replace(/[^a-zA-Z0-9.\-]/g, ""); 

  return safeName;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = sanitizeFilename(file.originalname);
    cb(null, uniqueSuffix + "-" + safeName);
  },
});

module.exports = multer({ storage: storage });