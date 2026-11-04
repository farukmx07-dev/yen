const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

const sampleProducts = [
  {
    name: 'Samsung Galaxy S23 Ultra 256GB',
    description: 'Samsung Galaxy S23 Ultra 256GB, 12GB RAM, 200MP Kamera, 5G, Android 13, S Pen Desteği',
    price: 34999.99,
    originalPrice: 44999.99,
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop',
    stock: 15,
    sku: 'SAMSUNG-S23-ULTRA-256',
    featured: true,
    discount: 22,
  },
  {
    name: 'Apple iPhone 15 Pro Max 256GB',
    description: 'Apple iPhone 15 Pro Max 256GB, Titanium, A17 Pro Chip, 48MP Ana Kamera, 5G',
    price: 54999.99,
    originalPrice: 59999.99,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
    stock: 8,
    sku: 'APPLE-IP15-PRO-MAX-256',
    featured: true,
    discount: 8,
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro 128GB',
    description: 'Xiaomi Redmi Note 13 Pro 128GB, 8GB RAM, 200MP Kamera, 67W Hızlı Şarj',
    price: 8999.99,
    originalPrice: 10999.99,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop',
    stock: 25,
    sku: 'XIAOMI-REDMI-NOTE13-128',
    featured: true,
    discount: 18,
  },
  {
    name: 'Adidas Ultraboost 23 Erkek Spor Ayakkabı',
    description: 'Adidas Ultraboost 23 Erkek Spor Ayakkabı, Primeknit Üst, Boost Orta Taban',
    price: 3499.99,
    originalPrice: 4499.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    stock: 30,
    sku: 'ADIDAS-UB23-ERKEK',
    featured: false,
    discount: 22,
  },
  {
    name: 'Nike Air Max 270 Kadın Spor Ayakkabı',
    description: 'Nike Air Max 270 Kadın Spor Ayakkabı, Air Max Taban, Hafif ve Konforlu',
    price: 3299.99,
    originalPrice: 3999.99,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    stock: 20,
    sku: 'NIKE-AM270-KADIN',
    featured: false,
    discount: 17,
  },
  {
    name: 'Arzum Okka Kahve Makinesi',
    description: 'Arzum Okka Minio Türk Kahvesi Makinesi, Otomatik Köpük, 2 Fincan Kapasiteli',
    price: 1999.99,
    originalPrice: 2499.99,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=800&h=800&fit=crop',
    stock: 12,
    sku: 'ARZUM-OKKA-MINIO',
    featured: true,
    discount: 20,
  },
  {
    name: 'Braun Multiquick 7 El Blender',
    description: 'Braun Multiquick 7 El Blender, 1000W Motor, 21 Hız Ayarı, Çelik Bıçak',
    price: 1499.99,
    originalPrice: 1999.99,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=800&fit=crop',
    stock: 18,
    sku: 'BRAUN-MQ7-BLENDER',
    featured: false,
    discount: 25,
  },
  {
    name: 'Dyson V15 Detect Kablosuz Süpürge',
    description: 'Dyson V15 Detect Kablosuz Süpürge, Lazer Toz Algılama, 60 Dakika Çalışma Süresi',
    price: 24999.99,
    originalPrice: 29999.99,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    stock: 5,
    sku: 'DYSON-V15-DETECT',
    featured: true,
    discount: 17,
  },
  {
    name: 'Samsung 55" QLED 4K Smart TV',
    description: 'Samsung 55" QLED 4K Smart TV, Quantum Dot Teknolojisi, Tizen OS, HDR10+',
    price: 24999.99,
    originalPrice: 32999.99,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop',
    stock: 7,
    sku: 'SAMSUNG-55-QLED-4K',
    featured: true,
    discount: 24,
  },
  {
    name: 'Apple MacBook Air M2 256GB',
    description: 'Apple MacBook Air M2 256GB, 13.6" Liquid Retina, 8GB RAM, 8 Çekirdekli GPU',
    price: 34999.99,
    originalPrice: 39999.99,
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
    stock: 10,
    sku: 'APPLE-MBA-M2-256',
    featured: true,
    discount: 12,
  },
];

function resolveCategoryId(categories, productName) {
  const defaultCategory = categories[0]?._id;
  const name = productName.toLowerCase();

  if (name.includes('samsung') || name.includes('iphone') || name.includes('xiaomi') || name.includes('redmi')) {
    return categories.find((c) => c.name.toLowerCase().includes('telefon') || c.name.toLowerCase().includes('elektronik'))?._id || defaultCategory;
  }
  if (name.includes('adidas') || name.includes('nike') || name.includes('ayakkabı')) {
    return categories.find((c) => c.name.toLowerCase().includes('giyim') || c.name.toLowerCase().includes('ayakkabı'))?._id || defaultCategory;
  }
  if (name.includes('arzum') || name.includes('braun') || name.includes('mutfak') || name.includes('blender')) {
    return categories.find((c) => c.name.toLowerCase().includes('mutfak') || c.name.toLowerCase().includes('ev'))?._id || defaultCategory;
  }
  if (name.includes('macbook') || name.includes('bilgisayar')) {
    return categories.find((c) => c.name.toLowerCase().includes('elektronik'))?._id || defaultCategory;
  }
  return defaultCategory;
}

function seedProducts() {
  initDb();
  const categories = readCollection('categories');

  if (categories.length === 0) {
    console.error('Kategori bulunamadı. Önce: node scripts/seed-categories.js');
    process.exit(1);
  }

  const products = readCollection('products');
  let added = 0;
  let skipped = 0;

  for (const product of sampleProducts) {
    if (products.some((p) => p.sku === product.sku)) {
      skipped++;
      continue;
    }

    const timestamp = now();
    products.push({
      _id: generateId(),
      ...product,
      category: resolveCategoryId(categories, product.name),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    added++;
    console.log(`✓ Eklendi: ${product.name}`);
  }

  writeCollection('products', products);
  console.log(`\n${added} ürün eklendi, ${skipped} atlandı.`);
}

seedProducts();
