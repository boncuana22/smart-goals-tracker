const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asigurăm că directorul de upload există
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurare stocare pentru Multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generăm un nume unic de fișier
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'financial-' + uniqueSuffix + fileExt);
  }
});

// Filtrare pentru a accepta doar fișiere Excel
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xls', '.xlsx', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (XLS, XLSX) and CSV files are allowed'), false);
  }
};

// Configurare multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limită
  }
});

module.exports = upload;