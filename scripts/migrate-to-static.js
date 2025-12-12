#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const Database = require(path.join(__dirname, '..', 'server', 'node_modules', 'better-sqlite3'));

async function main() {
  const root = path.resolve(__dirname, '..');
  const dbPath = path.join(root, 'server', 'hydrants.db');
  const publicDir = path.join(root, 'client', 'public');
  const uploadsSrc = path.join(root, 'uploads');
  const uploadsDst = path.join(publicDir, 'uploads');
  const dataPath = path.join(publicDir, 'data.json');

  if (!fs.existsSync(dbPath)) {
    console.error('Cannot find SQLite DB at', dbPath);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });
  const rows = db.prepare('SELECT id, x_coord, y_coord, image_large_path, image_thumb_path, created_at FROM hydrants ORDER BY created_at DESC').all();

  // Normalize paths to point at public/uploads
  const normalized = rows.map((r) => {
    const largeName = path.basename(r.image_large_path);
    const thumbName = path.basename(r.image_thumb_path);
    return {
      ...r,
      image_large_path: `/uploads/${largeName}`,
      image_thumb_path: `/uploads/${thumbName}`
    };
  });

  await fsp.mkdir(publicDir, { recursive: true });
  await fsp.writeFile(dataPath, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`Exported ${normalized.length} records to ${dataPath}`);

  if (fs.existsSync(uploadsSrc)) {
    await fsp.mkdir(uploadsDst, { recursive: true });
    const files = await fsp.readdir(uploadsSrc);
    for (const file of files) {
      const src = path.join(uploadsSrc, file);
      const dst = path.join(uploadsDst, file);
      await fsp.copyFile(src, dst);
    }
    console.log(`Copied ${files.length} files to ${uploadsDst}`);
  } else {
    console.warn('uploads directory not found; skipped copying images');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
