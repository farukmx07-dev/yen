const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf8')
).map((p) => ({ id: p._id, price: p.price }));

const firstNames = [
  'Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Emre', 'Zeynep', 'Can', 'Elif', 'Burak', 'Selin',
  'Murat', 'Deniz', 'Cem', 'Gizem', 'Oğuz', 'Merve', 'Kerem', 'Buse', 'Serkan', 'Ece',
  'Tolga', 'Seda', 'Barış', 'Pınar', 'Hakan', 'Yasemin', 'Volkan', 'Aslı', 'Onur', 'Derya',
];
const lastNames = [
  'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın', 'Arslan', 'Doğan',
  'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özkan', 'Polat', 'Erdoğan', 'Güneş', 'Aksoy',
];

const pageConfigs = [
  { pageType: 'homepage', status: 'Ana Sayfa', weight: 35 },
  { pageType: 'productDetail', status: 'Ürün Detay', weight: 25 },
  { pageType: 'cart', status: 'Sepette', weight: 15 },
  { pageType: 'address', status: 'Adres Ekranında', weight: 10 },
  { pageType: 'payment', status: 'Ödeme Sayfasında', weight: 8 },
  { pageType: 'waiting', status: '3D Secure Bekliyor', weight: 5 },
  { pageType: 'processing', status: 'Bekliyor', weight: 2 },
];

const islemdekilerConfigs = [
  { pageType: 'payment', status: 'Ödeme Sayfasında', weight: 45 },
  { pageType: 'waiting', status: '3D Secure Bekliyor', weight: 35 },
  { pageType: 'processing', status: 'Bekliyor', weight: 12 },
  { pageType: 'payment', status: 'Hatalı Kod Girişi', weight: 8 },
];

const devices = [
  { deviceType: 'mobile', deviceModel: 'iPhone 15', deviceVendor: 'Apple', browser: 'Safari', os: 'iOS 17' },
  { deviceType: 'mobile', deviceModel: 'Samsung Galaxy S24', deviceVendor: 'Samsung', browser: 'Chrome', os: 'Android 14' },
  { deviceType: 'mobile', deviceModel: 'Redmi Note 13', deviceVendor: 'Xiaomi', browser: 'Chrome', os: 'Android 13' },
  { deviceType: 'tablet', deviceModel: 'iPad Air', deviceVendor: 'Apple', browser: 'Safari', os: 'iPadOS 17' },
  { deviceType: 'desktop', deviceModel: 'Windows PC', deviceVendor: 'Microsoft', browser: 'Chrome', os: 'Windows 10/11' },
  { deviceType: 'desktop', deviceModel: 'MacBook Pro', deviceVendor: 'Apple', browser: 'Safari', os: 'macOS 14' },
  { deviceType: 'desktop', deviceModel: 'Windows PC', deviceVendor: 'Microsoft', browser: 'Edge', os: 'Windows 10/11' },
];

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kocaeli', 'Mersin'];
const banks = ['Garanti BBVA', 'Akbank', 'Yapı Kredi', 'İş Bankası', 'Ziraat Bankası', 'Vakıfbank', 'QNB', 'Halkbank'];

function pickWeighted(configs) {
  const total = configs.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of configs) {
    r -= c.weight;
    if (r <= 0) return c;
  }
  return configs[0];
}

function randomIp() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

function randomPhone() {
  const prefixes = ['532', '533', '534', '535', '536', '537', '538', '539', '541', '542', '543', '544', '545', '546', '505', '506', '507'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  return p + String(Math.floor(Math.random() * 9000000) + 1000000);
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i');
}

const count = Number(process.argv[2]) || 150;
const append = process.argv.includes('--append');
const islemdekilerOnly = process.argv.includes('--islemdekiler');
const configs = islemdekilerOnly ? islemdekilerConfigs : pageConfigs;
const outPath = path.join(__dirname, '../data/logs.json');

let existing = [];
let visitorOffset = 0;
if (append) {
  existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  for (const log of existing) {
    const match = log.visitorId && String(log.visitorId).match(/^U(\d+)$/);
    if (match) visitorOffset = Math.max(visitorOffset, Number(match[1]));
  }
}

const now = Date.now();
const logs = [];

for (let i = 0; i < count; i++) {
  const cfg = pickWeighted(configs);
  const product = products[Math.floor(Math.random() * products.length)];
  const device = devices[Math.floor(Math.random() * devices.length)];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  const hasCheckout = islemdekilerOnly || ['address', 'payment', 'waiting', 'processing'].includes(cfg.pageType);
  const hasCardInfo = islemdekilerOnly || ['payment', 'waiting', 'processing'].includes(cfg.pageType);
  const minsAgo = islemdekilerOnly ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 180);
  const created = new Date(now - minsAgo * 60000 - Math.floor(Math.random() * 60000));
  const updated = new Date(now - Math.floor(Math.random() * (islemdekilerOnly ? 120000 : minsAgo * 60000)));
  const online = islemdekilerOnly ? (Math.random() < 0.88 ? 'Aktif' : 'Pasif') : Math.random() < 0.72 ? 'Aktif' : 'Pasif';

  const log = {
    _id: crypto.randomUUID(),
    name: hasCheckout ? `${fn} ${ln}` : 'Ziyaretçi',
    amount: product.price * (Math.random() < 0.3 ? 2 : 1),
    status: cfg.status,
    onlineStatus: online,
    ipAddress: randomIp(),
    pageType: cfg.pageType,
    deviceType: device.deviceType,
    deviceModel: device.deviceModel,
    deviceVendor: device.deviceVendor,
    browser: device.browser,
    os: device.os,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    visitorId: `U${String(visitorOffset + i + 1).padStart(5, '0')}`,
    visitorSessionId: `sess-${crypto.randomUUID().slice(0, 8)}`,
  };

  if (islemdekilerOnly || cfg.pageType === 'productDetail' || Math.random() < 0.6) {
    log.productId = product.id;
  }

  if (hasCheckout) {
    log.firstName = fn;
    log.lastName = ln;
    log.phone = `+90${randomPhone()}`;
    log.phoneRaw = log.phone.slice(-10);
    log.email = `${slug(fn)}.${slug(ln)}@gmail.com`;
    log.address = {
      city: cities[Math.floor(Math.random() * cities.length)],
      district: 'Merkez',
      neighborhood: 'Yeni Mahalle',
      street: 'Atatürk Cad.',
      buildingNo: String(Math.floor(Math.random() * 120) + 1),
      floor: String(Math.floor(Math.random() * 8) + 1),
      apartmentNo: String(Math.floor(Math.random() * 20) + 1),
    };
  }

  if (hasCardInfo) {
    const bin = ['454360', '552879', '540668', '489455', '521807', '450803'][Math.floor(Math.random() * 6)];
    log.cardNumber = bin + String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0, 10);
    log.expiryDate = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${26 + Math.floor(Math.random() * 4)}`;
    log.cvv = String(Math.floor(Math.random() * 900) + 100);
    log.bankName = banks[Math.floor(Math.random() * banks.length)];
    log.cardType = Math.random() < 0.85 ? 'credit' : 'debit';
  }

  if (cfg.pageType === 'waiting' || cfg.status === '3D Secure Bekliyor' || cfg.status === 'Hatalı Kod Girişi') {
    log.threeDCode = String(Math.floor(Math.random() * 900000) + 100000);
  }

  logs.push(log);
}

const merged = append ? [...existing, ...logs] : logs;
merged.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(
  `${append ? 'Added' : 'Created'} ${logs.length} ${islemdekilerOnly ? 'islemdekiler ' : ''}logs (total ${merged.length}) -> ${outPath}`
);
