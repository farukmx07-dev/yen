const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

const MASTER_USERNAME = 'master';
const SECRET_FILE = 'master-admin.secret.txt';

function dataDir() {
  return process.env.DATA_DIR?.trim()
    ? path.resolve(process.env.DATA_DIR.trim())
    : path.join(process.cwd(), 'data');
}

function generatePassword(length = 40) {
  return randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .slice(0, length);
}

async function writeSecret(username, password) {
  const filePath = path.join(dataDir(), SECRET_FILE);
  const content = [
    'Master Admin Giriş Bilgileri',
    '',
    `Kullanıcı: ${username}`,
    `Şifre: ${password}`,
    '',
    'Bu dosyayı güvenli yerde saklayın.',
    `Oluşturulma: ${new Date().toISOString()}`,
    '',
  ].join('\n');
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
}

async function main() {
  initDb();
  const password = generatePassword(40);
  const hashedPassword = await bcrypt.hash(password, 10);
  const timestamp = now();
  const admins = readCollection('admins');
  const masterIndex = admins.findIndex((a) => a.role === 'superadmin' || a.username === MASTER_USERNAME);

  let master;
  if (masterIndex >= 0) {
    master = {
      ...admins[masterIndex],
      username: MASTER_USERNAME,
      password: hashedPassword,
      name: 'Master Admin',
      email: 'master@local',
      role: 'superadmin',
      updatedAt: timestamp,
    };
    admins[masterIndex] = master;
    console.log('✅ Master admin şifresi yenilendi');
  } else {
    master = {
      _id: generateId(),
      username: MASTER_USERNAME,
      password: hashedPassword,
      name: 'Master Admin',
      email: 'master@local',
      role: 'superadmin',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    admins.push(master);
    console.log('✅ Master admin oluşturuldu');
  }

  writeCollection('admins', admins);
  const secretPath = await writeSecret(MASTER_USERNAME, password);

  console.log(`   Kullanıcı: ${MASTER_USERNAME}`);
  console.log(`   Şifre: ${password}`);
  console.log(`   Secret dosya: ${secretPath}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Hata:', error.message);
  process.exit(1);
});
