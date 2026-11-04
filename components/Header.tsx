'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiSearch, FiShoppingCart, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { trackTikTok } from '@/lib/tiktokPixel';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import StoreBrandBar from './StoreBrandBar';
import CarrefourSAHeader from './stores/CarrefourSAHeader';
import SokMarketHeader from './stores/SokMarketHeader';
import BimMarketHeader from './stores/BimMarketHeader';

export default function Header() {
  const { storeMode } = useStoreTheme();

  if (storeMode === 'carrefoursa') {
    return <CarrefourSAHeader />;
  }

  if (storeMode === 'sokmarket') {
    return <SokMarketHeader />;
  }

  if (storeMode === 'bim') {
    return <BimMarketHeader />;
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackTikTok('Search', {
        search_string: searchQuery.trim(),
      });
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const horizontalCategories = [
    'Telefon & Aksesuar',
    'Elektronik',
    'Mutfak',
    'Kadın Spor Ayakkabı',
    'Kozmetik & Kişisel Bakım',
    'Kitap & Kırtasiye',
    'Erkek Spor Ayakkabı',
    'Çanta & Valiz',
  ];

  return (
    <header className="sticky top-0 z-50 shadow-lg w-full min-w-0 overflow-x-clip">
      <StoreBrandBar />

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 py-2 sm:py-2.5 md:py-3">
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative w-full">
                <FiSearch className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Aramak istediğin ürünü yaz..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 md:pl-12 pr-2.5 sm:pr-3 md:pr-4 py-2 sm:py-2.5 md:py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-a101-lightBlue focus:border-a101-lightBlue focus:shadow-md text-xs sm:text-sm transition-all duration-300 min-h-[40px] sm:min-h-[44px] md:min-h-[48px]"
                />
              </div>
            </form>

            <Link
              href="/cart"
              className="bg-a101-teal hover:bg-a101-tealLight active:bg-a101-teal text-white px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-black text-xs sm:text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md hover:shadow-lg active:shadow-sm relative touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] flex-shrink-0"
            >
              <FiShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="hidden sm:inline">Sepetim</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-a101-red text-white text-[10px] sm:text-xs font-black rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-1 sm:px-2 md:px-3 lg:px-4">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="w-full flex items-center justify-between py-1.5 sm:py-2 md:py-2.5 touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
          >
            <span className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base">Kategoriler</span>
            {showCategories ? (
              <FiChevronUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600 flex-shrink-0" />
            ) : (
              <FiChevronDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600 flex-shrink-0" />
            )}
          </button>

          {showCategories && (
            <div className="flex items-center flex-wrap gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 pb-1.5 sm:pb-2 md:pb-2.5 transition-all duration-300">
              {horizontalCategories.map((category, index) => (
                <div key={index} className="flex items-center">
                  <Link
                    href={`/search?category=${encodeURIComponent(category)}`}
                    className="text-gray-700 hover:text-a101-teal active:text-a101-teal font-semibold text-[9px] sm:text-[10px] md:text-xs lg:text-sm whitespace-nowrap transition-colors duration-300 flex-shrink-0 px-1 sm:px-1.5 md:px-2 lg:px-3 touch-manipulation min-h-[28px] sm:min-h-[32px] md:min-h-[36px] lg:min-h-[40px] leading-[1.3]"
                  >
                    {category}
                  </Link>
                  {index < horizontalCategories.length - 1 && (
                    <span className="text-gray-300 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs mx-0.5 sm:mx-0.5 md:mx-1">|</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
