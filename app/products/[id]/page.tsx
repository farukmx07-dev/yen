'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { FiShoppingCart, FiMinus, FiPlus, FiHeart, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { trackTikTok } from '@/lib/tiktokPixel';
import AddToCartModal, { type AddToCartModalProduct } from '@/components/AddToCartModal';
import ProductImageGallery from '@/components/ProductImageGallery';
import { getPrimaryProductImage } from '@/lib/productImages';
import { buildInstallmentOptions, formatInstallmentPrice } from '@/lib/installmentOptions';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import { formatProductIdForStore } from '@/lib/storeProductIds';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  stock: number;
  discount?: number;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
}

export default function ProductDetailPage() {
  const { copy, storeMode } = useStoreTheme();
  const isCarrefour = storeMode === 'carrefoursa';
  const isSok = storeMode === 'sokmarket';
  const isBim = storeMode === 'bim';
  const isStoreBrand = isCarrefour || isSok || isBim;
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState<AddToCartModalProduct | null>(null);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [productId]);

  useEffect(() => {
    if (!product) return;

    trackTikTok('ViewContent', {
      content_id: product._id,
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'TRY',
    });
  }, [product]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=3');
      const data = await res.json();
      if (data.success) {
        setRelatedProducts(data.data.filter((p: any) => p._id !== productId));
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: getPrimaryProductImage(product),
        quantity: quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    trackTikTok('AddToCart', {
      contents: [
        {
          content_id: product._id,
          content_name: product.name,
          content_type: 'product',
          quantity,
          price: product.price,
        },
      ],
      value: product.price * quantity,
      currency: 'TRY',
    });
    
    syncCartToMongoDB(cart);

    setCartModalProduct({
      name: product.name,
      price: product.price,
      image: getPrimaryProductImage(product),
      quantity,
    });
    setShowCartModal(true);
  };
  
  const syncCartToMongoDB = async (cartItems: any[]) => {
    try {
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const phone = user.phone || '';
      const phoneRaw = phone.replace(/\D/g, '').slice(-10);
      
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          phone: phone || undefined,
          phoneRaw: phoneRaw || undefined,
        }),
      });
    } catch (error) {
      console.error('Sepet senkronizasyon hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-a101-grayLight pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 aspect-square rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-a101-grayLight pb-16 md:pb-0 w-full min-w-0 overflow-x-clip">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ürün bulunamadı</h1>
          <Link href="/" className="text-a101-teal hover:text-a101-tealLight">
            Ana Sayfaya Dön
          </Link>
        </div>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : product.discount || 0;

  const installmentOptions = buildInstallmentOptions(product.price);

  return (
    <div className={`min-h-screen bg-a101-grayLight pb-20 md:pb-0 w-full min-w-0 overflow-x-clip ${isCarrefour ? 'csa-page-shell' : ''} ${isSok ? 'sok-page-shell' : ''} ${isBim ? 'bim-page-shell' : ''}`}>
      <Header />

      <main className="container mx-auto px-2 sm:px-2.5 md:px-3 lg:px-4 xl:px-6 py-2 sm:py-3 md:py-4 lg:py-6 xl:py-8">
        {/* Breadcrumb */}
        <div className="mb-2 sm:mb-3 md:mb-4 text-[10px] sm:text-xs md:text-sm text-gray-600 overflow-x-auto scrollbar-hide">
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 whitespace-nowrap">
            <Link href="/" className="hover:text-a101-teal text-[10px] sm:text-xs">Ana Sayfa</Link>
            <span className="text-[10px] sm:text-xs">›</span>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-a101-teal truncate max-w-[80px] sm:max-w-[100px] md:max-w-none text-[10px] sm:text-xs">
              {product.category.name}
            </Link>
            <span className="text-[10px] sm:text-xs">›</span>
            <span className="text-gray-900 truncate max-w-[120px] sm:max-w-[150px] md:max-w-none text-[10px] sm:text-xs">{product.name}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4 md:mb-6">
          {/* Product Image */}
          <div className="relative">
            <ProductImageGallery
              name={product.name}
              image={product.image}
              images={product.images}
              overlay={
                <>
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-gradient-to-r from-a101-red to-a101-redDark text-white px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-md font-black text-[10px] sm:text-xs md:text-sm shadow-lg z-10 whitespace-nowrap leading-tight">
                    {copy.productDetailInstallment}
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-white/95 hover:bg-white active:bg-white p-1.5 sm:p-2 rounded-full shadow-lg transition-all z-10 touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
                    aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  >
                    <FiHeart
                      size={16}
                      className={`sm:w-5 sm:h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                  {product.stock === 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1.5 rounded-md font-bold text-xs sm:text-sm shadow-lg z-10">
                      Stokta Yok
                    </div>
                  )}
                </>
              }
            />
          </div>

          {/* Product Info */}
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-6">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-gray-900 mb-1 sm:mb-1.5 md:mb-2 leading-tight">
                {product.name}
              </h1>
              {product.category && (
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5">
                  Ürün Kodu: {formatProductIdForStore(product._id, storeMode)}
                </p>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 md:gap-3 mb-1 sm:mb-1.5 md:mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">
                  ₺{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 line-through">
                    ₺{product.originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
                <span className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-semibold text-gray-700 whitespace-nowrap flex-shrink-0 leading-[1]">Adet:</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="hover:bg-gray-100 active:bg-gray-200 transition touch-manipulation flex items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] md:min-w-[40px] md:min-h-[40px] lg:min-w-[44px] lg:min-h-[44px]"
                    aria-label="Miktarı azalt"
                  >
                    <FiMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] lg:w-5 lg:h-5" />
                  </button>
                  <span className="font-bold text-center leading-[1] px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base lg:text-lg min-w-[1.75rem] sm:min-w-[2rem] md:min-w-[2.5rem] lg:min-w-[3rem]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="hover:bg-gray-100 active:bg-gray-200 transition touch-manipulation flex items-center justify-center p-1.5 sm:p-2 md:p-2.5 lg:p-3 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] md:min-w-[40px] md:min-h-[40px] lg:min-w-[44px] lg:min-h-[44px]"
                    aria-label="Miktarı artır"
                  >
                    <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full rounded-lg font-black transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-md transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                product.stock === 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : isCarrefour
                    ? 'bg-[#FFD100] hover:bg-[#ffe033] active:bg-[#f5c800] text-[#004E97]'
                    : isSok
                      ? 'bg-[#FFD100] hover:bg-[#ffe033] active:bg-[#f5c800] text-gray-900'
                      : isBim
                        ? 'bg-[#ED1C24] hover:bg-[#C4000F] active:bg-[#ff3b44] text-white'
                        : 'bg-a101-lightBlue hover:bg-a101-teal active:bg-a101-tealLight text-white'
              } ${
                /* Responsive padding */
                'py-2.5 px-3 sm:py-3 sm:px-4 md:py-3.5 md:px-5 lg:py-4 lg:px-6'
              } ${
                /* Responsive text size */
                'text-xs sm:text-sm md:text-base lg:text-lg'
              } ${
                /* Responsive min-height */
                'min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]'
              }`}
              style={{ 
                display: 'flex !important', 
                alignItems: 'center !important', 
                justifyContent: 'center !important',
                gap: '0.5rem',
                flexWrap: 'nowrap'
              }}
            >
              <FiShoppingCart 
                className="flex-shrink-0" 
                style={{ 
                  display: 'block !important',
                  width: '1rem',
                  height: '1rem',
                  flexShrink: 0
                }} 
              />
              <span 
                className="whitespace-nowrap leading-[1] font-inherit" 
                style={{ 
                  display: 'inline-block !important',
                  lineHeight: '1 !important',
                  verticalAlign: 'middle !important'
                }}
              >
                Sepete Ekle
              </span>
            </button>

            {/* Payment Options */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-200 pt-2 sm:pt-2.5 md:pt-3 lg:pt-4" style={{ display: 'block', width: '100%' }}>
              <div 
                className="mb-2 sm:mb-2.5 md:mb-3 lg:mb-4" 
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '2px',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-1 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] leading-[1.2] ${
                    activeTab === 'details'
                      ? 'text-a101-teal border-b-2 border-a101-teal bg-a101-teal/5'
                      : 'text-gray-600 hover:text-a101-teal'
                  }`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  <span className="truncate text-center">Ürün Detayları</span>
                </button>
                <button
                  onClick={() => setActiveTab('installments')}
                  className={`px-1 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] leading-[1.2] ${
                    activeTab === 'installments'
                      ? 'text-a101-teal border-b-2 border-a101-teal bg-a101-teal/5'
                      : 'text-gray-600 hover:text-a101-teal'
                  }`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  <span className="truncate text-center">Taksit Seçenekleri</span>
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`px-1 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] leading-[1.2] ${
                    activeTab === 'shipping'
                      ? 'text-a101-teal border-b-2 border-a101-teal bg-a101-teal/5'
                      : 'text-gray-600 hover:text-a101-teal'
                  }`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  <span className="truncate text-center">Kargo Koşulları</span>
                </button>
                <button
                  onClick={() => setActiveTab('return')}
                  className={`px-1 sm:px-2 md:px-2.5 lg:px-3 xl:px-4 py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] leading-[1.2] ${
                    activeTab === 'return'
                      ? 'text-a101-teal border-b-2 border-a101-teal bg-a101-teal/5'
                      : 'text-gray-600 hover:text-a101-teal'
                  }`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  <span className="truncate text-center">İade Koşulları</span>
                </button>
              </div>

              <div className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-[1.6] sm:leading-[1.7] md:leading-[1.8] lg:leading-relaxed min-h-[200px] sm:min-h-[220px] md:min-h-[250px] lg:min-h-[300px] w-full tab-content-container">
                {activeTab === 'details' && (
                  <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 pb-2 border-b-2 border-a101-lightBlue">
                      Ürün Özellikleri
                    </h3>
                    <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                      Ürün Açıklaması
                    </h4>
                    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                      {product.description ? (
                        product.description.split('\n').filter(line => line.trim()).map((line, index) => (
                          <p key={index} className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                            {line.trim()}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                          Ürün detayları yakında eklenecektir.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'installments' && (
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Taksit Seçenekleri</h3>
                    {installmentOptions.map((option) => (
                      <div
                        key={option.installments}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3"
                      >
                        <span className="font-semibold text-sm sm:text-base md:text-lg leading-[1.4]">{option.label}</span>
                        <span className="font-bold text-a101-teal text-sm sm:text-base md:text-lg leading-[1.4]">
                          {option.installments === 1
                            ? `₺${formatInstallmentPrice(option.monthlyAmount)}`
                            : `₺${formatInstallmentPrice(option.monthlyAmount)} x ${option.installments}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Kargo Koşulları</h3>
                    <p className="text-sm sm:text-base md:text-lg leading-[1.6]">• Ürünler müşterinin belirttiği adrese teslim edilir.</p>
                    <p className="text-sm sm:text-base md:text-lg leading-[1.6]">• Kargo süresi 7 iş günüdür.</p>
                    <p className="text-sm sm:text-base md:text-lg leading-[1.6]">• 20 TL ve üzeri alışverişlerde kargo ücretsizdir.</p>
                    <p className="text-sm sm:text-base md:text-lg leading-[1.6]">• {copy.deliveryNote}</p>
                  </div>
                )}
                {activeTab === 'return' && (
                  <div className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-5 w-full">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 md:p-5 lg:p-6 rounded-r-lg mb-3 sm:mb-4 md:mb-5">
                      <h3 className="font-black text-a101-teal text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-2.5 md:mb-3 leading-tight">İade ve Değişim Koşulları</h3>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-[1.6] sm:leading-[1.7]">
                        {copy.returnPolicyIntro}
                      </p>
                    </div>
                    
                    <div className="space-y-2.5 sm:space-y-3 md:space-y-3.5 lg:space-y-4 w-full">
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">14 Gün İade Hakkı:</strong> Ürünleriniz teslim tarihinden itibaren 14 gün içinde iade edilebilir.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">Orijinal Ambalaj:</strong> Ürün orijinal ambalajında, etiketleri ve aksesuarları ile birlikte iade edilmelidir.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">Hasarsız Ürün:</strong> Ürün kullanılmamış, hasarsız ve tüm parçaları ile birlikte olmalıdır.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">İade Kargo Ücreti:</strong> {copy.returnShippingNote}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">İade İşlem Süresi:</strong> İade edilen ürünler kontrol edildikten sonra ödeme 3-5 iş günü içinde hesabınıza iade edilir.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">İade Başvurusu:</strong> İade işlemi için müşteri hizmetlerimiz ile iletişime geçebilir veya online sipariş panelinizden iade talebi oluşturabilirsiniz.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 w-full">
                        <span className="text-a101-teal font-bold text-base sm:text-lg md:text-xl lg:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">•</span>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-[1.6] sm:leading-[1.7] text-gray-700 flex-1">
                          <strong className="font-bold text-gray-900 text-base sm:text-lg md:text-xl lg:text-2xl">İade Edilemeyen Ürünler:</strong> Kişisel bakım ürünleri, iç çamaşırı, yüzme kıyafetleri ve özel sipariş ürünler iade edilemez.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 mt-4 sm:mt-5 md:mt-6">
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-[1.6] sm:leading-[1.7]">
                        <strong className="font-bold text-gray-700 text-base sm:text-lg md:text-xl lg:text-2xl">Not:</strong> İade işlemleri için detaylı bilgi almak üzere müşteri hizmetlerimiz ile iletişime geçebilirsiniz. Telefon: <a href={`tel:${copy.supportPhone.replace(/\s/g, '')}`} className="text-a101-teal hover:underline font-bold text-base sm:text-lg md:text-xl">{copy.supportPhone}</a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4">Diğer Ürünler</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Fixed Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-40 md:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-gray-900">
              ₺{product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-6 py-2.5 rounded-lg font-black text-sm transition-all ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : isCarrefour
                  ? 'bg-[#FFD100] hover:bg-[#ffe033] text-[#004E97]'
                  : isSok
                    ? 'bg-[#FFD100] hover:bg-[#ffe033] text-gray-900'
                    : isBim
                      ? 'bg-[#ED1C24] hover:bg-[#C4000F] text-white'
                      : 'bg-a101-lightBlue hover:bg-a101-teal text-white'
            }`}
          >
            Sepete Ekle
          </button>
        </div>
      </div>

      <StoreFooter />
      <BottomNav />

      <AddToCartModal
        isOpen={showCartModal}
        product={cartModalProduct}
        onClose={() => setShowCartModal(false)}
      />
    </div>
  );
}
