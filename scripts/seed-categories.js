// Kategorileri JSON veritabanına ekler
// Kullanım: node scripts/seed-categories.js

const { initDb, readCollection, writeCollection, generateId, now } = require('./lib/jsonDb');

const sampleCategories = [
  { name: 'Telefon & Aksesuar', slug: 'telefon-aksesuar', description: 'Akıllı telefonlar ve aksesuarları' },
  { name: 'Elektronik', slug: 'elektronik', description: 'Elektronik ürünler' },
  { name: 'Mutfak', slug: 'mutfak', description: 'Mutfak gereçleri ve aletleri' },
  { name: 'Kadın Spor Ayakkabı', slug: 'kadin-spor-ayakkabi', description: 'Kadın spor ayakkabıları' },
  { name: 'Kozmetik & Kişisel Bakım', slug: 'kozmetik-kisisel-bakim', description: 'Kozmetik ve kişisel bakım ürünleri' },
  { name: 'Kitap & Kırtasiye', slug: 'kitap-kirtasiye', description: 'Kitap ve kırtasiye ürünleri' },
  { name: 'Erkek Spor Ayakkabı', slug: 'erkek-spor-ayakkabi', description: 'Erkek spor ayakkabıları' },
  { name: 'Çanta & Valiz', slug: 'canta-valiz', description: 'Çanta ve valiz çeşitleri' },
  { name: 'Ev & Yaşam', slug: 'ev-yasam', description: 'Ev ve yaşam ürünleri' },
  { name: 'Giyim & Aksesuar', slug: 'giyim-aksesuar', description: 'Giyim ve aksesuar ürünleri' },
];

function seedCategories() {
  initDb();
  const categories = readCollection('categories');
  const timestamp = now();

  for (const category of sampleCategories) {
    const index = categories.findIndex((c) => c.slug === category.slug);
    if (index >= 0) {
      categories[index] = { ...categories[index], ...category, updatedAt: timestamp };
      console.log(`✓ Kategori güncellendi: ${category.name}`);
    } else {
      categories.push({
        _id: generateId(),
        ...category,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`✓ Kategori eklendi: ${category.name}`);
    }
  }

  writeCollection('categories', categories);
  console.log(`\nToplam ${categories.length} kategori kayıtlı.`);
}

seedCategories();
