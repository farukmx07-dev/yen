'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { logVisitor } from '@/lib/visitorLogger';
import { setupInactiveListener } from '@/lib/setLogInactive';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    
    // Kategoriler sayfası ziyaretçi loglama - sayfaya girildiğinde hemen log oluştur
    logVisitor({ pageType: 'homepage' });
    
    // Siteden çıkınca pasif yap
    setupInactiveListener();
    
    // Her 5 saniyede bir güncelle (gerçek zamanlı aktif kalma için)
    const interval = setInterval(() => {
      logVisitor({ pageType: 'homepage' });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
      <Header />

      <main className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-6 lg:py-8">
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-tight">Tüm Kategoriler</h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-1.5 sm:mb-2"></div>
                <div className="h-3 sm:h-3.5 md:h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 hover:shadow-lg transition text-center group touch-manipulation min-h-[120px] sm:min-h-[140px] md:min-h-[160px]"
              >
                <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 group-hover:bg-primary-100 transition">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">📦</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 mt-0.5 sm:mt-1 md:mt-2 line-clamp-2 leading-[1.3]">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}


