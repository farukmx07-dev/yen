const bcrypt = require('bcryptjs');
const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

async function createTestUsers() {
  try {
    initDb();
    const timestamp = now();

    const users = readCollection('users');
    const userIndex = users.findIndex((u) => u.phoneRaw === '5551234567');

    const testUser = {
      _id: userIndex >= 0 ? users[userIndex]._id : generateId(),
      phone: '+90 555 123 45 67',
      phoneRaw: '5551234567',
      name: 'Test',
      surname: 'Kullanıcı',
      email: 'test@a101.com',
      emailVerified: true,
      birthDate: '01-01-1990',
      gender: 'Erkek',
      role: 'user',
      addresses: [
        {
          _id: generateId(),
          title: 'Ev Adresim',
          type: 'Ev',
          city: 'İstanbul',
          cityId: 34,
          district: 'Kadıköy',
          districtId: 3401,
          neighborhood: 'Acıbadem',
          neighborhoodId: 340101,
          street: 'Test Caddesi',
          buildingNo: '123',
          floor: '3',
          apartmentNo: '5',
          description: 'Test adresi',
          name: 'Test',
          surname: 'Kullanıcı',
          invoiceType: 'Bireysel',
        },
      ],
      createdAt: userIndex >= 0 ? users[userIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (userIndex >= 0) users[userIndex] = testUser;
    else users.push(testUser);
    writeCollection('users', users);

    const admins = readCollection('admins');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminIndex = admins.findIndex((a) => a.username === 'admin');

    const adminUser = {
      _id: adminIndex >= 0 ? admins[adminIndex]._id : generateId(),
      username: 'admin',
      password: hashedPassword,
      name: 'Admin',
      email: 'admin@a101.com',
      role: 'admin',
      createdAt: adminIndex >= 0 ? admins[adminIndex].createdAt : timestamp,
      updatedAt: timestamp,
    };

    if (adminIndex >= 0) admins[adminIndex] = adminUser;
    else admins.push(adminUser);
    writeCollection('admins', admins);

    console.log('✅ Test kullanıcı ve admin oluşturuldu');
    console.log('   Admin: admin / admin123');
    console.log('   Test user phone: 5551234567');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createTestUsers();
