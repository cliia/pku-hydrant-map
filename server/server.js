const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

const dbPath = path.resolve(__dirname, 'hydrants.db');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS hydrants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x_coord REAL NOT NULL,
  y_coord REAL NOT NULL,
  image_large_path TEXT NOT NULL,
  image_thumb_path TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

app.use('/uploads', express.static(uploadDir));

const listStmt = db.prepare('SELECT * FROM hydrants ORDER BY created_at DESC');
const insertStmt = db.prepare('INSERT INTO hydrants (x_coord, y_coord, image_large_path, image_thumb_path) VALUES (?, ?, ?, ?)');
const deleteStmt = db.prepare('DELETE FROM hydrants WHERE id = ?');
const findStmt = db.prepare('SELECT * FROM hydrants WHERE id = ?');
const updateStmt = db.prepare('UPDATE hydrants SET x_coord = ?, y_coord = ? WHERE id = ?');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/hydrants', (req, res) => {
  const rows = listStmt.all();
  res.json(rows);
});

app.post('/api/hydrants', upload.single('photo'), async (req, res) => {
  try {
    const { x_coord, y_coord } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    const x = parseFloat(x_coord);
    const y = parseFloat(y_coord);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const timestamp = Date.now();
    const baseName = `${timestamp}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const largeName = `large-${baseName}`;
    const thumbName = `thumb-${baseName}`;

    const largePath = path.join(uploadDir, largeName);
    const thumbPath = path.join(uploadDir, thumbName);

    await sharp(req.file.buffer).resize({ width: 2048, withoutEnlargement: true }).toFile(largePath);
    await sharp(req.file.buffer).resize({ width: 200, withoutEnlargement: true }).toFile(thumbPath);

    const publicLarge = `/uploads/${largeName}`;
    const publicThumb = `/uploads/${thumbName}`;

    const info = insertStmt.run(x, y, publicLarge, publicThumb);

    res.status(201).json({ id: info.lastInsertRowid, x_coord: x, y_coord: y, image_large_path: publicLarge, image_thumb_path: publicThumb });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create hydrant' });
  }
});

app.patch('/api/hydrants/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { x_coord, y_coord } = req.body;
  const x = parseFloat(x_coord);
  const y = parseFloat(y_coord);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const existing = findStmt.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  updateStmt.run(x, y, id);
  res.json({ ...existing, x_coord: x, y_coord: y });
});

app.delete('/api/hydrants/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const row = findStmt.get(id);
  deleteStmt.run(id);
  if (row) {
    [row.image_large_path, row.image_thumb_path].forEach((p) => {
      const abs = path.resolve(__dirname, '..', p.replace(/^\//, ''));
      if (fs.existsSync(abs)) {
        fs.unlink(abs, () => {});
      }
    });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
