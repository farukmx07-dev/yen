'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import ProductCard from '@/components/ProductCard';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { logVisitor } from '@/lib/visitorLogger';
import { setupInactiveListener } from '@/lib/setLogInactive';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  stock: number;
  category: { _id: string; name: string };
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kategori sayfası ziyaretçi loglama - sayfaya girildiğinde hemen log oluştur
    logVisitor({ pageType: 'homepage' });
    
    // Siteden çıkınca pasif yap
    setupInactiveListener();
    
    // Her 5 saniyede bir güncelle (gerçek zamanlı aktif kalma için)
    const logInterval = setInterval(() => {
      logVisitor({ pageType: 'homepage' });
    }, 5000);
    
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);

        const categoriesData = await categoriesRes.json();
        const productsData = await productsRes.json();

        if (categoriesData.success) {
          const foundCategory = categoriesData.data.find((cat: Category) => cat.slug === slug);
          setCategory(foundCategory || null);

          if (foundCategory && productsData.success) {
            const categoryProducts = productsData.data.filter(
              (p: Product) => p.category?._id === foundCategory._id
            );
            setProducts(categoryProducts);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    return () => clearInterval(logInterval);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
        <Header />
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-7 md:h-8 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-5 md:mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-200 aspect-square rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
        <Header />
        <div className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8 text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Kategori bulunamadı</h1>
          <Link href="/categories" className="text-primary-600 hover:text-primary-700 text-sm sm:text-base md:text-lg touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px] inline-flex items-center justify-center">
            Kategorilere Dön
          </Link>
        </div>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
      <Header />

      <main className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6 lg:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-primary-600 mb-3 sm:mb-4 md:mb-6 touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm md:text-base">Ana Sayfaya Dön</span>
        </Link>

        <div className="mb-4 sm:mb-5 md:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1.5 sm:mb-2 leading-tight">{category.name}</h1>
          {category.description && (
            <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-[1.5]">{category.description}</p>
          )}
        </div>

        {products.length > 0 ? (
          <div className="product-grid gap-2 sm:gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 sm:p-8 md:p-10 lg:p-12 text-center">
            <p className="text-sm sm:text-base md:text-lg text-gray-500">Bu kategoride henüz ürün bulunmamaktadır.</p>
          </div>
        )}
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}

