#!/usr/bin/env node
/**
 * JSON dosyalarindaki verileri MySQL'e aktarir.
 * Kullanim: node scripts/migrate-json-to-mysql.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

const COLLECTIONS = [
  'users',
  'admins',
  'categories',
  'products',
  'orders',
  'logs',
  'carts',
  'admin-logs',
];

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS documents (
  collection_name VARCHAR(32) NOT NULL,
  doc_id CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (collection_name, doc_id),
  KEY idx_collection_updated (collection_name, updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT NOT NULL PRIMARY KEY,
  payload JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

function toMysqlDate(iso) {
  if (!iso) return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, 23);
  return String(iso).replace('T', ' ').replace('Z', '').slice(0, 23);
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'market',
    waitForConnections: true,
    connectionLimit: 5,
  });

  for (const statement of SCHEMA_SQL.split(';').map((s) => s.trim()).filter(Boolean)) {
    await pool.execute(statement);
  }

  let total = 0;

  for (const collection of COLLECTIONS) {
    const filePath = path.join(DATA_DIR, `${collection}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  skip ${collection} (dosya yok)`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`  skip ${collection} (bos)`);
      continue;
    }

    for (const item of items) {
      if (!item._id) continue;
      const createdAt = toMysqlDate(item.createdAt);
      const updatedAt = toMysqlDate(item.updatedAt || item.createdAt);
      await pool.execute(
        `INSERT INTO documents (collection_name, doc_id, payload, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)`,
        [collection, item._id, JSON.stringify(item), createdAt, updatedAt]
      );
      total += 1;
    }

    console.log(`  ${collection}: ${items.length} kayit`);
  }

  const settingsPath = path.join(DATA_DIR, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    await pool.execute(
      `INSERT INTO app_settings (id, payload) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
      [JSON.stringify(settings)]
    );
    console.log('  settings: 1 kayit');
    total += 1;
  }

  await pool.end();
  console.log(`\nToplam ${total} kayit MySQL'e aktarildi.`);
}

main().catch((err) => {
  console.error('Migration hatasi:', err.message);
  process.exit(1);
});
