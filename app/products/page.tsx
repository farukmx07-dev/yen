'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import CampaignProductsModal from '@/components/CampaignProductsModal';
import { FiChevronDown, FiChevronRight, FiX, FiFilter } from 'react-icons/fi';
import { setupInactiveListener } from '@/lib/setLogInactive';
import CampaignCountdownBanner from '@/components/CampaignCountdownBanner';
import { computeTimeLeft } from '@/lib/campaignUtils';
import { STOREFRONT_SETTINGS_POLL_MS } from '@/lib/constants';
import { useStoreTheme } from '@/components/StoreThemeProvider';

interface Product {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  stock: number;
  featured: boolean;
  category: { name: string; _id: string };
}

export default function ProductsPage() {
  const { copy, storeMode } = useStoreTheme();
  const isCarrefour = storeMode === 'carrefoursa';
  const isSok = storeMode === 'sokmarket';
  const isBim = storeMode === 'bim';
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFirsatModal = searchParams.get('firsat') === '1';
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [campaignEndDate, setCampaignEndDate] = useState<string | null>(null);
  const [campaignStartDate, setCampaignStartDate] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const campaignProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  useEffect(() => {
    if (!showFirsatModal) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFirsatModal]);

  const closeFirsatModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('firsat');
    const query = params.toString();
    router.replace(query ? `/products?${query}` : '/products');
  };

  useEffect(() => {
    fetchProducts();
    fetchCampaignSettings();
    setupInactiveListener();

    const settingsInterval = setInterval(fetchCampaignSettings, STOREFRONT_SETTINGS_POLL_MS);

    return () => {
      clearInterval(settingsInterval);
    };
  }, []);

  useEffect(() => {
    const tick = () => setTimeLeft(computeTimeLeft(campaignEndDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [campaignEndDate]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, sortBy, selectedPriceRange, selectedBrand]);

  const fetchCampaignSettings = async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCampaignStartDate(data.data.campaignStartDate || null);
        setCampaignEndDate(data.data.campaignEndDate || null);
      }
    } catch (error) {
      console.error('Kampanya ayarları yüklenemedi:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setFilteredProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category?._id === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      filtered = filtered.filter((product) => {
        if (max) {
          return product.price >= min && product.price <= max;
        }
        return product.price >= min;
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const categories = [
    { name: 'Elektronik', id: 'elektronik' },
    { name: 'Ev & Yaşam', id: 'ev-yasam' },
    { name: 'Giyim & Aksesuar', id: 'giyim-aksesuar' },
    { name: 'Anne & Bebek & Oyuncak', id: 'anne-bebek' },
    { name: 'Oto & Bahçe & Yapı', id: 'oto-bahce' },
    { name: 'Kozmetik & Kişisel Bakım', id: 'kozmetik' },
    { name: 'Kitap & Kırtasiye', id: 'kitap' },
    { name: 'Market', id: 'market' },
  ];

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

  const priceRanges = [
    { label: '₺3 - ₺2.100', value: '3-2100' },
    { label: '₺2.100 - ₺6.600', value: '2100-6600' },
    { label: '₺6.600 - ₺12.000', value: '6600-12000' },
    { label: '₺12.000 - ₺20.000', value: '12000-20000' },
    { label: '₺20.000+', value: '20000-999999' },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleShowMore = () => {
    const query = searchParams.toString();
    router.push(query ? `/products?${query}` : '/products');
    router.refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-a101-grayLight pb-16 md:pb-0 w-full min-w-0 overflow-x-clip ${isCarrefour ? 'csa-page-shell' : ''} ${isSok ? 'sok-page-shell' : ''} ${isBim ? 'bim-page-shell' : ''}`}>
      <Header />

      {/* Campaign Banner */}
      <CampaignCountdownBanner
        campaignStartDate={campaignStartDate}
        campaignEndDate={campaignEndDate}
        timeLeft={timeLeft}
      />

      {/* Horizontal Category Navigation */}
      <section className={`bg-white border-b border-gray-200 py-1.5 sm:py-2 md:py-3 sticky z-40 shadow-sm ${isCarrefour ? 'csa-sticky-offset' : 'top-[60px] sm:top-[65px] md:top-[73px]'}`}>
        <div className="container mx-auto min-w-0 px-[var(--container-padding)]">
          <div className={`flex max-w-full min-w-0 items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide sm:gap-3 md:gap-4 lg:gap-6 sm:pb-1.5 md:pb-2 ${isCarrefour ? 'csa-scroll-x' : ''}`}>
            {horizontalCategories.map((cat, index) => (
              <a
                key={index}
                href="#"
                className="shrink-0 text-gray-700 hover:text-a101-teal active:text-a101-teal font-semibold text-fluid-xs md:text-fluid-sm whitespace-nowrap transition-colors px-1.5 sm:px-2 touch-manipulation min-h-[var(--touch-target)] inline-flex items-center"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>

      <main className="container mx-auto min-w-0 px-[var(--container-padding)] py-3 sm:py-4 md:py-6">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-3 sm:mb-4 flex items-center justify-between gap-2">
          <h2 className="text-fluid-base sm:text-fluid-lg md:text-fluid-xl lg:text-fluid-2xl font-black text-gray-900 flex-1 min-w-0 truncate">{copy.productsSectionTitle}</h2>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 bg-a101-teal hover:bg-a101-tealLight active:bg-a101-teal text-white px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm touch-manipulation min-h-[36px] sm:min-h-[40px] md:min-h-[44px] flex-shrink-0"
          >
            <FiFilter size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
            <span className="whitespace-nowrap">Filtreler</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left Sidebar - Categories & Filters */}
          <aside className={`${showMobileFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white rounded-lg sm:rounded-xl shadow-lg p-2.5 sm:p-3 md:p-4 lg:p-5 h-fit lg:sticky lg:top-[140px] fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto overflow-y-auto lg:overflow-y-visible`}>
            {/* Mobile Close Button */}
            <div className="lg:hidden flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
              <h3 className="font-black text-gray-900 text-base sm:text-lg">Filtreler</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
                aria-label="Filtreleri kapat"
              >
                <FiX size={18} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            {/* Categories */}
            <div className="mb-4 sm:mb-5 md:mb-6">
              <h3 className="font-black text-gray-900 text-sm sm:text-base md:text-lg mb-2.5 sm:mb-3 md:mb-4">Kategoriler</h3>
              <div className="space-y-0.5 sm:space-y-1">
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between text-gray-700 hover:text-a101-teal active:text-a101-teal font-semibold text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 transition-colors touch-manipulation min-h-[36px] sm:min-h-[40px] px-1 sm:px-2 rounded"
                    >
                      <span className="truncate">{category.name}</span>
                      {expandedCategories[category.id] ? (
                        <FiChevronDown size={12} className="sm:w-4 sm:h-4 flex-shrink-0 ml-1 sm:ml-2" />
                      ) : (
                        <FiChevronRight size={12} className="sm:w-4 sm:h-4 flex-shrink-0 ml-1 sm:ml-2" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="font-black text-gray-900 text-sm sm:text-base md:text-lg mb-2.5 sm:mb-3 md:mb-4">Filtreler</h3>
              
              {/* Price Range */}
              <div className="mb-4 sm:mb-5 md:mb-6">
                <h4 className="font-bold text-gray-800 text-[11px] sm:text-xs md:text-sm mb-2 sm:mb-2.5 md:mb-3">Fiyat Aralığı</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.value} className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 p-1 sm:p-1.5 rounded transition-colors touch-manipulation">
                      <input
                        type="radio"
                        name="priceRange"
                        value={range.value}
                        checked={selectedPriceRange === range.value}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-a101-teal focus:ring-a101-teal cursor-pointer touch-manipulation"
                      />
                      <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div>
                <h4 className="font-bold text-gray-800 text-[11px] sm:text-xs md:text-sm mb-2 sm:mb-2.5 md:mb-3">Marka</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 p-1 sm:p-1.5 rounded transition-colors touch-manipulation">
                    <input
                      type="checkbox"
                      checked={selectedBrand === 'akel'}
                      onChange={(e) => setSelectedBrand(e.target.checked ? 'akel' : 'all')}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-a101-teal focus:ring-a101-teal cursor-pointer touch-manipulation"
                    />
                    <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Akel</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="mb-3 sm:mb-4 hidden lg:block">
              <h2 className="text-fluid-xl md:text-fluid-2xl font-black text-gray-900 min-w-0 truncate">{copy.productsSectionTitle}</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1">{filteredProducts.length} ürün</p>
            </div>
            <div className="mb-3 sm:mb-4 lg:hidden">
              <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{filteredProducts.length} ürün</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 [&>*]:min-w-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-xl mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="product-grid gap-3 sm:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <div className="mt-6 sm:mt-8 flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={handleShowMore}
                    className="w-full max-w-md rounded-xl border-2 border-a101-teal bg-white px-6 py-3.5 text-sm sm:text-base font-bold text-a101-teal transition-colors hover:bg-a101-teal hover:text-white active:bg-a101-tealLight touch-manipulation"
                  >
                    Daha fazla ürün göster
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
                <p className="text-gray-500 font-semibold text-sm sm:text-base">Ürün bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />

      {showFirsatModal && (
        <CampaignProductsModal
          products={campaignProducts}
          loading={loading}
          onClose={closeFirsatModal}
        />
      )}
    </div>
  );
}
