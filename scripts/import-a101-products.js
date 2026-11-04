const fs = require('fs');
const path = require('path');
const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PRODUCTS_DIR = path.join(PUBLIC_DIR, 'products');

const CATEGORIES = {
  telefon: '52e75dc1-032f-4550-bc48-b3c9ad329cc8',
  elektronik: '9c445610-47f9-4985-b240-dff1355b1d9c',
  mutfak: '6d13380a-81ee-4041-870b-4dc894d16a14',
  kozmetik: '976394a5-5a70-4173-babc-942d947253c7',
  evYasam: '7af72b04-7fec-4071-8e75-60bcb45a4d9c',
  giyim: '86cd306d-4fe9-41ac-a267-bdf114790db6',
};

const rawProducts = [
  { id: 19, name: 'Arzum Okka Grandio Duo OK007 İkili Türk Kahvesi Makinesi', imageKey: 'arzum', price: 5000, properties: 'Fincan Kapasitesi: 10\nGüç: 710 W\nCezve Sayısı: 2\nSu Hazne Kapasitesi: 2.3 lt\nSeri: Arzum Okka', brand: 'Arzum', sku: '263195', category: 'mutfak' },
  { id: 24, name: 'APEC APX7 200 cc Benzinli Motosiklet', imageKey: 'apx7', price: 79999, properties: 'Azami Hız: 105 km/saat\nAzami Net Güç: 9,3 kW\nKütle: 145 kg\nYakıt Tankı: 10,8 L\n2 yıl garantili', brand: 'Volta', sku: '848121', category: 'elektronik' },
  { id: 25, name: 'Onvo 85VQ90F3UA 85" Frameless 4K Ultra HD Google QLED TV', imageKey: '85vq', price: 9999, properties: '85" 216 cm\nF enerji sınıfı\nDahili uydu alıcısı\n4K Ultra HD\n2 yıl garantili\nÜcretsiz kurulum', brand: 'Onvo', sku: '734126', category: 'elektronik' },
  { id: 26, name: 'Apple iPhone 16 128 GB Cep Telefonu Laciverttaş', imageKey: 'iphone16plus', price: 49999, properties: '128 GB\nApple A18\n6.1 inç OLED\n48+12 MP arka kamera\n2 yıl Türkiye garantili', brand: 'Apple', sku: '260532', category: 'telefon' },
  { id: 27, name: 'Altus AL CM 121460 D 12 Kg 1400 Devir Çamaşır Makinesi', imageKey: 'alcm', price: 19999, properties: '12 kg kapasite\n1400 rpm\nEnerji sınıfı A\n15 program\n3 yıl garanti', brand: 'Altus', sku: '260657', category: 'elektronik' },
  { id: 28, name: 'Guess GUGW0544L2 Kadın Kol Saati', imageKey: 'guesskadin', price: 1999, properties: 'Kasa çapı: 32 mm\nQuartz\nMineral cam\nSu geçirmezlik: 3 ATM\n2 yıl garanti', brand: 'Guess', sku: '260730', category: 'giyim' },
  { id: 29, name: 'Apple Airpods Pro 3 MFHP4TU/A Bluetooth Kulaklık', imageKey: 'airpodspro3', price: 6999, properties: 'Aktif gürültü engelleme\nAdaptif ses\nBluetooth 5.3\nMagSafe şarj\n2 yıl garantili', brand: 'Apple', sku: '260697', category: 'telefon' },
  { id: 30, name: 'Apple iPhone 17 Pro Max 256 GB Cep Telefonu Abis', imageKey: 'iphone17', price: 99999, properties: '256 GB\nA19 Pro çip\n6.9 inç OLED\n48 MP Pro Fusion kamera\n2 yıl Apple Türkiye garantili', brand: 'Apple', sku: '949281', category: 'telefon' },
  { id: 31, name: 'Dolu Montana 12 V Kumandalı Akülü Araba', imageKey: '8190oyuncak', price: 6999, properties: '12 V akülü\nUzaktan kumanda\nEmniyet kemeri\n4 süspansiyon\n2 yıl garantili', brand: 'Dolu Oyuncak', sku: '26070437', category: 'evYasam' },
  { id: 32, name: 'Dreame D20 Akıllı Robot Süpürge', imageKey: 'dreame', price: 10999, properties: 'Lidar navigasyon\n700 W\nHEPA filtre\n11000 Pa emiş\n2 yıl garanti', brand: 'Dreame', sku: '26071572', category: 'evYasam' },
  { id: 33, name: 'Sony PS5 Slim Digital Edition 825 GB Oyun Konsolu', imageKey: 'sonyps5', price: 19999, properties: '825 GB SSD\n4K/UHD\n120 fps\nDualSense kontrolcü dahil\n2 yıl ithalatçı garantili', brand: 'Sony', sku: '26074188', category: 'elektronik' },
  { id: 34, name: 'Tefal Virtuoso Tencere Seti 7 Parça', imageKey: 'tefal', price: 899, properties: 'Paslanmaz çelik\n7 parça set\nİndüksiyon uyumlu\nBulaşık makinesinde yıkanabilir', brand: 'Tefal', sku: '752191', category: 'mutfak' },
  { id: 35, name: 'Philips Daily Collection HD2590/90 Ekmek Kızartma Makinesi Siyah', imageKey: 'izgara', price: 699, properties: '8 kızartma ayarı\nEntegre çörek ısıtıcısı\nDahili sandviç ısıtıcı\n2 yıl garantili', brand: 'Philips', sku: '26025682', category: 'mutfak' },
  { id: 38, name: 'Dyson Supersonic 1600W Saç Kurutma Makinesi Nikel Bakır', imageKey: 'dyson', price: 9999, properties: '1600 W\n3 hız / 4 ısı ayarı\nİyon teknolojisi\n270 cm kablo\n2 yıl garantili', brand: 'Dyson', sku: '842194', category: 'kozmetik' },
  { id: 39, name: 'DYSON V10 Total Clean Kablosuz Şarjlı Dikey Süpürge', imageKey: 'dysonsupurge', price: 14999, properties: '150 AW güç\n60 dk kullanım\n770 ml hazne\n5 fırça/başlık\n24 ay garanti', brand: 'Dyson', sku: '854128', category: 'evYasam' },
  { id: 44, name: 'Prima Premium Care Bebek Bezi No:5 Ultra Fırsat Paketi 74 Adet', imageKey: 'prima', price: 399, properties: 'No:5\n74 adet\nUltra yumuşak\nPişiğe karşı koruma\nDermatolojik test', brand: 'Prima', sku: '651239', category: 'kozmetik' },
  { id: 46, name: 'Arzum Tea Blend AR3141 1650 W Çay Makinesi', imageKey: 'arzumjollie', price: 599, properties: 'Cam demlik\n1.8 lt su ısıtıcı\n360° döner taban\n1650 W', brand: 'Arzum', sku: '389195', category: 'mutfak' },
  { id: 47, name: 'Philips PowerCyclone XB2142/10 850 W Toz Torbasız Elektrikli Süpürge', imageKey: 'philipssupurge', price: 1299, properties: '850 W\nPowerCyclone 4\nSuper Clean Air filtre\nMobilya başlığı\n2 yıl garantili', brand: 'Philips', sku: '785219', category: 'evYasam' },
  { id: 48, name: 'Karaca Emirgan XL Saklama Kaplı 10 Parça Çelik Tencere Seti', imageKey: 'karaca', price: 999, properties: '10 parça\nİndüksiyonlu\nCam kapaklı\nÇelik sap', brand: 'Karaca', sku: '483288', category: 'mutfak' },
  { id: 49, name: 'Stanley Quencher H2.O FlowState Tumbler 1,18 L Siyah', imageKey: 'stanley', price: 599, properties: '1,18 lt\nPaslanmaz çelik\nÇift duvarlı vakum\nPipetli kapak\nAraba bardaklığı uyumlu', brand: 'Stanley', sku: '512821', category: 'giyim' },
  { id: 50, name: 'Stanley Quencher H2.O FlowState Tumbler 1,18 L Bej', imageKey: 'stainlessstanley', price: 599, properties: '1,18 lt\nPaslanmaz çelik\nÇift duvarlı vakum\nPipetli kapak\nAraba bardaklığı uyumlu', brand: 'Stanley', sku: '521984', category: 'giyim' },
  { id: 52, name: "5'Lİ ÖZEL KASAP KURBAN BIÇAĞI SET", imageKey: 'bicak', price: 799, properties: 'T5 paslanmaz çelik\nKök ceviz kabze\n5 parça set\nDeri yüzme ve kemik sıyırma bıçakları', brand: 'Çakıroğlu', sku: '732197', category: 'mutfak', featured: true },
  { id: 53, name: 'Stanley Klasik Vakumlu Yeşil 2.3 lt Çelik Termos', imageKey: 'yesilstanley', price: 499, properties: '2.3 lt\n18/8 paslanmaz çelik\nÇift cidarlı vakum\nSızdırmaz kapak', brand: 'Stanley', sku: '141273', category: 'giyim', featured: true },
  { id: 54, name: "Mounty 4'lü Katlanır Piknik Ve Kamp Sandalyesi", imageKey: 'mounty', price: 399, properties: '4 adet sandalye\n110 kg taşıma\nKatlanır tasarım\nTaşıma çantası dahil', brand: 'Mounty Kamp', sku: '621356', category: 'evYasam', featured: true },
];

function normalizeKey(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findPublicImage(imageKey) {
  const dir = fs.existsSync(PRODUCTS_DIR) ? PRODUCTS_DIR : PUBLIC_DIR;
  const files = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const target = normalizeKey(imageKey);

  const exact = files.find((f) => normalizeKey(path.parse(f).name) === target);
  if (exact) return `/products/${exact}`;

  const partial = files.find((f) => {
    const name = normalizeKey(path.parse(f).name);
    return name.includes(target) || target.includes(name);
  });
  if (partial) return `/products/${partial}`;

  return '/products/placeholder.png';
}

function cleanText(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function importProducts() {
  initDb();
  const timestamp = now();
  const products = rawProducts.map((item) => ({
    _id: `a101-${item.id}`,
    name: cleanText(item.name),
    description: cleanText(item.properties),
    price: item.price,
    image: findPublicImage(item.imageKey),
    category: CATEGORIES[item.category],
    stock: item.price > 30000 ? 5 : item.price > 10000 ? 10 : 25,
    sku: item.sku,
    featured: Boolean(item.featured),
    brand: item.brand,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  writeCollection('products', products);

  console.log(`✅ ${products.length} ürün products.json dosyasına aktarıldı.\n`);
  products.forEach((p) => {
    console.log(`  [${p.sku}] ${p.name.substring(0, 50)}... → ${p.image}`);
  });
}

importProducts();
