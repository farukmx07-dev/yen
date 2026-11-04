'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight, FiCheck, FiTag } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import ProductImage from '@/components/ProductImage';
import { useStoreTheme } from '@/components/StoreThemeProvider';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

function formatPrice(value: number) {
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CartPage() {
  const { storeMode } = useStoreTheme();
  const isSok = storeMode === 'sokmarket';
  const isCarrefour = storeMode === 'carrefoursa';
  const isBim = storeMode === 'bim';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [waitingStatus, setWaitingStatus] = useState<{ show: boolean; message: string } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    checkUserLogStatus();

    const interval = setInterval(() => {
      checkUserLogStatus();
    }, 5000);

    return () => {
      window.removeEventListener('cartUpdated', loadCart);
      clearInterval(interval);
    };
  }, []);

  const checkUserLogStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.phone) return;

      const phoneRaw = user.phone.replace(/\D/g, '').slice(-10);
      if (phoneRaw.length !== 10) return;

      const res = await fetch(`/api/logs?phone=${phoneRaw}&t=${Date.now()}`);
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        const latestLog = data.data[0];
        if (latestLog.status === 'Bekliyor' && latestLog.onlineStatus === 'Aktif') {
          setWaitingStatus({
            show: true,
            message: 'Ödeme işleminiz kontrol ediliyor. Lütfen bekleyiniz...',
          });
        } else {
          setWaitingStatus(null);
        }
      } else {
        setWaitingStatus(null);
      }
    } catch (error) {
      console.error('Log durumu kontrol hatası:', error);
    }
  };

  const syncCartToMongoDB = async (items: CartItem[]) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const phone = user.phone || '';
      const phoneRaw = phone.replace(/\D/g, '').slice(-10);

      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          phone: phone || undefined,
          phoneRaw: phoneRaw || undefined,
        }),
      });
    } catch (error) {
      console.error('Sepet senkronizasyon hatası:', error);
    }
  };

  const clearCartFromMongoDB = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const phone = user.phone || '';
      const phoneRaw = phone.replace(/\D/g, '').slice(-10);

      await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || undefined,
          phoneRaw: phoneRaw || undefined,
        }),
      });
    } catch (error) {
      console.error('Sepet temizleme hatası:', error);
    }
  };

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);

    if (cart.length > 0) {
      syncCartToMongoDB(cart);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    syncCartToMongoDB(updatedCart);
  };

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter((item) => item.productId !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    if (updatedCart.length > 0) {
      syncCartToMongoDB(updatedCart);
    } else {
      clearCartFromMongoDB();
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Sepetiniz boş!');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div
      className={`cart-page-shell min-h-screen min-h-dvh w-full min-w-0 max-w-[100vw] overflow-x-clip bg-a101-grayLight pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
        isCarrefour ? 'csa-page-shell' : ''
      } ${isSok ? 'sok-page-shell' : ''} ${isBim ? 'bim-page-shell' : ''}`}
    >
      <Header />

      <main className="container mx-auto w-full max-w-full min-w-0 px-[var(--container-padding)] py-[clamp(0.75rem,2.5vw,2rem)]">
        <header className="cart-page-header mb-[clamp(0.75rem,2.5vw,1.5rem)] min-w-0">
          <h1 className="text-fluid-3xl font-black text-gray-900">Sepetim</h1>
          <p className="mt-1 text-fluid-sm text-gray-600">{cartItems.length} ürün eklendi</p>
        </header>

        {waitingStatus?.show && (
          <div
            role="status"
            className="mb-[clamp(0.75rem,2vw,1.5rem)] min-w-0 overflow-hidden rounded-lg border-2 border-blue-500 bg-blue-600 p-[clamp(0.75rem,2vw,1rem)] text-white shadow-lg"
          >
            <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-white sm:mt-0" />
              <p className="min-w-0 flex-1 break-words text-fluid-sm font-semibold leading-snug">
                {waitingStatus.message}
              </p>
            </div>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="min-w-0 overflow-hidden rounded-xl bg-white p-[clamp(1.5rem,5vw,3rem)] text-center shadow-lg">
            <FiShoppingBag size={64} className="mx-auto mb-4 text-gray-400" aria-hidden />
            <h2 className="text-fluid-2xl font-black text-gray-800">Sepetiniz Boş</h2>
            <p className="mt-2 text-fluid-sm text-gray-600">Alışverişe başlamak için ürünlere göz atın</p>
            <Link
              href="/products"
              className="mt-6 inline-flex min-h-[44px] max-w-full items-center justify-center gap-2 rounded-lg bg-a101-lightBlue px-5 py-3 text-fluid-sm font-black text-white transition-colors hover:bg-a101-teal active:bg-a101-tealLight"
            >
              <span>Alışverişe Başla</span>
              <FiArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="cart-page-grid grid min-w-0 grid-cols-1 gap-[clamp(0.75rem,2vw,1.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(260px,22rem)] xl:grid-cols-[minmax(0,1fr)_minmax(280px,24rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,26rem)] [&>*]:min-w-0">
            <section aria-label="Sepet ürünleri" className="cart-items-section min-w-0 space-y-[clamp(0.625rem,2vw,1rem)]">
              {cartItems.map((item) => (
                <article
                  key={item.productId}
                  className="cart-item-card min-w-0 overflow-hidden rounded-xl bg-white p-[clamp(0.625rem,2vw,1.5rem)] shadow-lg"
                >
                  <div className="cart-item-grid grid min-w-0 grid-cols-[minmax(4rem,22vw)_minmax(0,1fr)] items-start gap-[clamp(0.5rem,2vw,1rem)] xs:grid-cols-[minmax(4.5rem,20vw)_minmax(0,1fr)] sm:grid-cols-[clamp(5rem,14vw,6.5rem)_minmax(0,1fr)]">
                    <div className="cart-item-image relative mx-auto aspect-square w-full max-w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-gray-50 sm:mx-0">
                      <div className="flex h-full w-full items-center justify-center p-1 sm:p-1.5">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="h-auto max-h-full w-auto max-w-full object-contain"
                          fallback={
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="text-xl xs:text-2xl sm:text-3xl" aria-hidden>
                                📦
                              </span>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-[clamp(0.375rem,1.5vw,0.75rem)]">
                      <h3 className="cart-item-title line-clamp-3 break-words text-fluid-base font-black leading-snug text-gray-900 sm:line-clamp-2">
                        {item.name}
                      </h3>

                      <div className="cart-item-controls flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                        <p className="cart-item-price shrink-0 text-fluid-lg font-black text-a101-teal">
                          ₺{formatPrice(item.price)}
                        </p>

                        <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                          <div className="cart-quantity flex shrink-0 items-center overflow-hidden rounded-lg border-2 border-gray-300">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="cart-qty-btn flex h-9 w-9 shrink-0 items-center justify-center touch-manipulation transition hover:bg-gray-100 active:bg-gray-200 xs:h-10 xs:w-10 sm:h-11 sm:w-11"
                              aria-label="Miktarı azalt"
                            >
                              <FiMinus className="h-3.5 w-3.5 xs:h-4 xs:w-4" aria-hidden />
                            </button>
                            <span className="min-w-[2rem] border-x border-gray-300 px-1.5 py-1.5 text-center text-fluid-sm font-bold leading-none xs:min-w-[2.25rem] xs:px-2 xs:py-2 sm:min-w-[2.75rem]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="cart-qty-btn flex h-9 w-9 shrink-0 items-center justify-center touch-manipulation transition hover:bg-gray-100 active:bg-gray-200 xs:h-10 xs:w-10 sm:h-11 sm:w-11"
                              aria-label="Miktarı artır"
                            >
                              <FiPlus className="h-3.5 w-3.5 xs:h-4 xs:w-4" aria-hidden />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="cart-remove-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 transition touch-manipulation hover:bg-red-50 active:bg-red-100 xs:h-10 xs:w-10 sm:h-11 sm:w-11"
                            aria-label="Ürünü sil"
                          >
                            <FiTrash2 className="h-4 w-4 xs:h-[1.125rem] xs:w-[1.125rem] sm:h-5 sm:w-5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-subtotal mt-2 flex min-w-0 flex-col gap-0.5 border-t border-gray-200 pt-2 xxs:flex-row xxs:items-center xxs:justify-between sm:mt-3 sm:gap-1 sm:pt-3">
                    <span className="text-fluid-sm font-semibold text-gray-500">Satır Toplamı</span>
                    <span className="text-fluid-lg font-black text-gray-900">
                      ₺{formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <aside
              aria-label="Sepet özeti"
              className="cart-summary-aside min-w-0 lg:sticky lg:self-start cart-summary-sticky"
            >
              <div className="cart-summary-card min-w-0 overflow-hidden rounded-xl bg-white p-[clamp(0.75rem,2.5vw,1.5rem)] shadow-lg">
                <h2 className="text-fluid-xl font-black text-gray-900">Sepet Özeti</h2>

                <div className="cart-coupon mt-4 min-w-0">
                  <label htmlFor="cart-coupon" className="mb-1.5 flex items-center gap-1.5 text-fluid-xs font-semibold text-gray-700">
                    <FiTag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Kupon Kodu
                  </label>
                  <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
                    <input
                      id="cart-coupon"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Kupon kodunuzu girin"
                      className="cart-coupon-input w-full min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-fluid-sm outline-none focus:border-a101-lightBlue focus:ring-1 focus:ring-a101-lightBlue"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="cart-coupon-btn w-full shrink-0 rounded-lg border-2 border-a101-teal px-4 py-2.5 text-fluid-sm font-bold text-a101-teal transition-colors hover:bg-a101-teal hover:text-white active:bg-a101-tealLight sm:w-auto sm:min-w-[5.5rem]"
                    >
                      Uygula
                    </button>
                  </div>
                </div>

                {shipping === 0 && (
                  <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-[clamp(0.5rem,1.5vw,0.75rem)]">
                    <FiCheck className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
                    <span className="min-w-0 break-words text-fluid-sm font-semibold text-green-700">
                      Ücretsiz Teslimat
                    </span>
                  </div>
                )}

                <dl className="mt-4 space-y-2 sm:space-y-3">
                  <div className="flex min-w-0 flex-col gap-0.5 xxs:flex-row xxs:items-center xxs:justify-between xxs:gap-3">
                    <dt className="shrink-0 text-fluid-sm font-semibold text-gray-700">Sepet Tutarı</dt>
                    <dd className="min-w-0 break-all text-fluid-sm font-black text-gray-900 xxs:text-right">
                      ₺{formatPrice(subtotal)}
                    </dd>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 xxs:flex-row xxs:items-center xxs:justify-between xxs:gap-3">
                    <dt className="shrink-0 text-fluid-sm font-semibold text-gray-700">Kargo Ücreti</dt>
                    <dd className="min-w-0 break-all text-fluid-sm font-black text-gray-900 xxs:text-right">
                      ₺{formatPrice(shipping)}
                    </dd>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-2 sm:pt-3">
                    <div className="flex min-w-0 flex-col gap-0.5 xxs:flex-row xxs:items-center xxs:justify-between xxs:gap-3">
                      <dt className="text-fluid-lg font-black text-gray-900">Toplam</dt>
                      <dd className="min-w-0 break-all text-fluid-lg font-black text-gray-900 xxs:text-right">
                        ₺{formatPrice(total)}
                      </dd>
                    </div>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="cart-checkout-btn mt-5 flex min-h-[var(--touch-target)] w-full max-w-full items-center justify-center rounded-lg bg-a101-lightBlue px-4 py-3 text-fluid-base font-black text-white shadow-lg transition-colors hover:bg-a101-teal active:bg-a101-tealLight"
                >
                  Devam Et
                </button>

                <Link
                  href="/products"
                  className="cart-continue-link mt-4 block text-center text-fluid-sm font-semibold text-a101-teal transition-colors hover:text-a101-tealLight"
                >
                  Alışverişe Devam Et
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
