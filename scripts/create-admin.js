// Admin kullanıcısı oluşturma script'i
// Kullanım: node scripts/create-admin.js [username] [password] [name] [email]

const bcrypt = require('bcryptjs');
const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

async function createAdmin() {
  try {
    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const password = args[1] || 'admin123';
    const name = args[2] || 'Admin';
    const email = args[3] || 'admin@a101.com';
    const role = args[4] || 'admin';

    initDb();
    const admins = readCollection('admins');
    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = now();

    const index = admins.findIndex((a) => a.username === username);
    let admin;

    if (index >= 0) {
      admin = {
        ...admins[index],
        password: hashedPassword,
        name,
        email,
        role: role === 'superadmin' ? 'superadmin' : 'admin',
        updatedAt: timestamp,
      };
      admins[index] = admin;
    } else {
      admin = {
        _id: generateId(),
        username,
        password: hashedPassword,
        name,
        email,
        role: role === 'superadmin' ? 'superadmin' : 'admin',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      admins.push(admin);
    }

    writeCollection('admins', admins);

    console.log('✅ Admin kullanıcısı oluşturuldu/güncellendi');
    console.log(`   Kullanıcı Adı: ${username}`);
    console.log(`   Şifre: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

createAdmin();
