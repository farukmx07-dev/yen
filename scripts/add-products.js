// Örnek ürünleri eklemek için script
// Kullanım: node scripts/add-products.js

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

async function addProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('Kategoriler alınıyor...');
  const categoriesRes = await fetch(`${baseUrl}/api/categories`);
  const categoriesData = await categoriesRes.json();
  
  if (!categoriesData.success || categoriesData.data.length === 0) {
    console.error('Hata: Kategori bulunamadı. Önce kategorileri oluşturun.');
    return;
  }
  
  const categories = categoriesData.data;
  const defaultCategory = categories[0]._id;
  
  console.log(`\n${categories.length} kategori bulundu. Varsayılan kategori: ${categories[0].name}`);
  console.log('\nÜrünler ekleniyor...\n');
  
  let added = 0;
  let skipped = 0;
  
  for (const product of sampleProducts) {
    try {
      // Kategori eşleştirme
      let categoryId = defaultCategory;
      
      const productName = product.name.toLowerCase();
      if (productName.includes('samsung') || productName.includes('iphone') || 
          productName.includes('xiaomi') || productName.includes('redmi')) {
        const phoneCat = categories.find(c => c.name.toLowerCase().includes('telefon') || 
                                             c.name.toLowerCase().includes('elektronik'));
        if (phoneCat) categoryId = phoneCat._id;
      } else if (productName.includes('adidas') || productName.includes('nike') || 
                 productName.includes('ayakkabı')) {
        const shoesCat = categories.find(c => c.name.toLowerCase().includes('giyim') || 
                                            c.name.toLowerCase().includes('ayakkabı'));
        if (shoesCat) categoryId = shoesCat._id;
      } else if (productName.includes('arzum') || productName.includes('braun') || 
                 productName.includes('korkmaz') || productName.includes('kahve') || 
                 productName.includes('blender')) {
        const kitchenCat = categories.find(c => c.name.toLowerCase().includes('mutfak') || 
                                              c.name.toLowerCase().includes('ev'));
        if (kitchenCat) categoryId = kitchenCat._id;
      } else if (productName.includes('macbook') || productName.includes('thinkpad') || 
                 productName.includes('bilgisayar')) {
        const compCat = categories.find(c => c.name.toLowerCase().includes('elektronik') || 
                                          c.name.toLowerCase().includes('bilgisayar'));
        if (compCat) categoryId = compCat._id;
      }
      
      const productData = {
        ...product,
        category: categoryId,
      };
      
      const res = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        console.log(`✓ ${product.name}`);
        added++;
      } else {
        if (data.error && data.error.includes('duplicate')) {
          console.log(`⊘ Zaten mevcut: ${product.name}`);
          skipped++;
        } else {
          console.error(`✗ Hata: ${product.name} - ${data.error}`);
        }
      }
    } catch (error) {
      console.error(`✗ Hata: ${product.name} - ${error.message}`);
    }
  }
  
  console.log(`\n✓ Toplam: ${added} ürün eklendi`);
  if (skipped > 0) {
    console.log(`⊘ ${skipped} ürün atlandı (zaten mevcut)`);
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (typeof window === 'undefined') {
  addProducts().catch(console.error);
}

module.exports = { addProducts, sampleProducts };

