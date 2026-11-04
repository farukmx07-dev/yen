'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import { logVisitor } from '@/lib/visitorLogger';
import { setupInactiveListener } from '@/lib/setLogInactive';
import { trackTikTok } from '@/lib/tiktokPixel';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  stock: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchProducts();
    } else {
      setLoading(false);
    }
    
    // Arama sayfası ziyaretçi loglama - sayfaya girildiğinde hemen log oluştur
    logVisitor({ pageType: 'homepage' });
    
    // Siteden çıkınca pasif yap
    setupInactiveListener();
    
    // Her 5 saniyede bir güncelle (gerçek zamanlı aktif kalma için)
    const interval = setInterval(() => {
      logVisitor({ pageType: 'homepage' });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [query]);

  const searchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        const filtered = data.data.filter((product: Product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        setProducts(filtered);
        trackTikTok('Search', {
          search_string: query,
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
      <Header />

      <main className="container mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 leading-tight">
          Arama Sonuçları: <span className="text-a101-teal">"{query}"</span>
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <p className="text-gray-600 mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm md:text-base leading-[1.4]">{products.length} ürün bulundu</p>
            <div className="product-grid gap-2 sm:gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
          </>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">
              "{query}" için ürün bulunamadı
            </p>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">Farklı bir arama terimi deneyin</p>
          </div>
        )}
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}



