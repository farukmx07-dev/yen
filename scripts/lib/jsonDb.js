const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function collectionPath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function generateId() {
  return randomUUID();
}

function now() {
  return new Date().toISOString();
}

function readCollection(name) {
  ensureDataDir();
  const filePath = collectionPath(name);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCollection(name, data) {
  ensureDataDir();
  const filePath = collectionPath(name);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

function initDb() {
  ensureDataDir();
  const files = ['users', 'admins', 'categories', 'products', 'orders', 'logs', 'carts'];
  for (const name of files) {
    const filePath = collectionPath(name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  }
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          _id: generateId(),
          businessName: 'A101',
          siteActive: true,
          createdAt: now(),
          updatedAt: now(),
        },
        null,
        2
      ),
      'utf-8'
    );
  }
}

module.exports = {
  DATA_DIR,
  initDb,
  readCollection,
  writeCollection,
  generateId,
  now,
};
