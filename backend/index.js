const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.static("uploads"));

// Setup SQLite Database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error(err.message);
  console.log("Connected to SQLite database.");
});

db.run(
  `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
);

// Route utama untuk memastikan server berjalan
app.get("/", (req, res) => {
  res.send("Backend Server is Running!");
});

// Endpoint untuk mengunggah gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const { filename, path: filepath } = req.file;

  const sql = "INSERT INTO images (filename, filepath) VALUES (?, ?)";
  db.run(sql, [filename, filepath], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ id: this.lastID, filename, filepath });
  });
});

// Endpoint untuk mendapatkan semua gambar
app.get("/images", (req, res) => {
  const sql = "SELECT * FROM images";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(
      rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        url: `http://localhost:${PORT}/${row.filepath}`,
        timestamp: row.timestamp,
      }))
    );
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
