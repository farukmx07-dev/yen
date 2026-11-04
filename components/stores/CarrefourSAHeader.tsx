'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiShoppingCart,
  FiChevronDown,
  FiGrid,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { trackTikTok } from '@/lib/tiktokPixel';
import { CARREFOURSA_ASSETS } from '@/lib/storeAssets';
import CarrefourSALogo from '@/components/Logos/CarrefourSALogo';

const NAV_LINKS = [
  { label: 'Kampanyalar', href: '/products?firsat=1', highlight: true },
  { label: 'Kataloglar', href: '/products' },
  { label: 'CarrefourSA Ekstra', href: '/products' },
  { label: 'CarrefourSA Blog', href: '/products' },
  { label: 'Payfour', href: '/products' },
];

const GROCERY_CATEGORIES = [
  'Meyve, Sebze',
  'Et, Balık, Tavuk',
  'Süt, Kahvaltılık',
  'Temel Gıda',
  'İçecekler',
  'Temizlik',
  'Kişisel Bakım',
  'Bebek',
];

const TOP_LINKS = [
  { label: 'Mağazalarımız', href: '/products' },
  { label: 'Kurumsal', href: '/products' },
  { label: 'Lezzet Arası', href: '/products' },
  { label: 'Bayilik Başvuru Formu', href: '/products', accent: true },
];

export default function CarrefourSAHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0));
      setCartTotal(
        cart.reduce(
          (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
          0
        )
      );
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackTikTok('Search', { search_string: searchQuery.trim() });
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 overflow-x-clip shadow-md">
      <Link href="/products" className="block w-full max-w-full bg-[#004E97]">
        <Image
          src={CARREFOURSA_ASSETS.bannerFreeDelivery}
          alt="1-30 Haziran Ücretsiz Teslimat"
          width={1400}
          height={80}
          priority
          sizes="100vw"
          className="h-auto w-full max-h-[clamp(2.75rem,8vw,4.5rem)] object-cover object-center"
        />
      </Link>

      <div className="hidden border-b border-gray-100 bg-white sm:block">
        <div className="container mx-auto flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-[var(--container-padding)] py-1.5 text-fluid-xs text-gray-600">
          {TOP_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`shrink-0 touch-manipulation hover:text-[#004E97] ${link.accent ? 'text-[#E2001A] hover:underline' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products"
            className="ml-auto shrink-0 touch-manipulation rounded-full bg-[#004E97] px-3 py-1 font-semibold text-white hover:bg-[#003d7a] min-h-[var(--touch-target)] inline-flex items-center"
          >
            Sipariş Takibi
          </Link>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-2 sm:py-3">
          <div className="flex min-w-0 flex-col gap-2 xs:flex-row xs:items-center xs:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link
                href="/products"
                className="inline-flex shrink-0 items-center touch-manipulation"
                aria-label="CarrefourSA Ana Sayfa"
              >
                <CarrefourSALogo className="rounded-md" />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="ml-auto inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] shrink-0 items-center justify-center rounded-full border border-gray-200 text-[#004E97] touch-manipulation hover:border-[#004E97] lg:hidden"
                aria-label="Menüyü aç"
              >
                <FiMenu className="h-5 w-5" />
              </button>

              <Link
                href="/cart"
                className="relative inline-flex min-h-[var(--touch-target)] shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-2 text-fluid-xs font-semibold text-gray-800 touch-manipulation hover:border-[#004E97] xs:ml-0 sm:px-3 lg:hidden"
                aria-label={`Sepetim${cartCount > 0 ? `, ${cartCount} ürün` : ''}`}
              >
                <FiShoppingCart className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="hidden max-w-[5.5rem] truncate xxs:inline sm:max-w-none">
                  {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                </span>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E2001A] text-[0.625rem] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>

            <form onSubmit={handleSearch} className="min-w-0 flex-1 xs:order-none">
              <div className="flex min-w-0 overflow-hidden rounded-full border border-gray-200 bg-[#f5f5f5]">
                <div className="relative min-w-0 flex-1">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Aramak istediğin ürünü yaz..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-w-0 bg-transparent py-2.5 pl-9 pr-2 text-fluid-xs focus:outline-none sm:py-3 sm:text-fluid-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 touch-manipulation bg-[#004E97] px-3 text-fluid-xs font-bold text-white hover:bg-[#003d7a] min-h-[var(--touch-target)] sm:px-6 sm:text-fluid-sm"
                >
                  Ara
                </button>
              </div>
            </form>

            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <Link
                href="/products"
                className="flex min-w-0 items-center gap-2 whitespace-nowrap text-fluid-xs text-gray-700 touch-manipulation hover:text-[#004E97]"
              >
                <Image
                  src={CARREFOURSA_ASSETS.biziDinliyoruz}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 object-contain"
                />
                Bizi Dinliyoruz
              </Link>
              <Link
                href="/cart"
                className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-fluid-xs font-semibold text-gray-800 touch-manipulation hover:border-[#004E97] min-h-[var(--touch-target)]"
              >
                <FiShoppingCart className="h-5 w-5 shrink-0" />
                <span className="max-w-[7rem] truncate xl:max-w-none">
                  {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                </span>
                <FiChevronDown className="hidden h-3 w-3 shrink-0 xl:block" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E2001A] text-[0.625rem] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden bg-[#003d7a] text-white lg:block">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)]">
          <div className="csa-scroll-x gap-0 py-0">
            <Link
              href="/categories"
              className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-fluid-xs font-semibold touch-manipulation hover:bg-white/10 sm:text-fluid-sm min-h-[var(--touch-target)]"
            >
              <FiGrid className="h-4 w-4 shrink-0" />
              Kategoriler
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`shrink-0 px-3 py-2.5 text-fluid-xs font-semibold touch-manipulation hover:bg-white/10 sm:text-fluid-sm min-h-[var(--touch-target)] ${
                  link.highlight ? 'text-[#5eead4]' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasyon menüsü">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 touch-manipulation"
            aria-label="Menüyü kapat"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,20rem)] max-w-full flex-col bg-white shadow-2xl safe-area-inset-top safe-area-inset-bottom">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <CarrefourSALogo className="rounded-md" />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full border border-gray-200 touch-manipulation"
                aria-label="Menüyü kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <p className="mb-2 text-fluid-xs font-bold uppercase tracking-wide text-gray-500">Menü</p>
              <ul className="mb-6 space-y-1">
                <li>
                  <Link
                    href="/categories"
                    onClick={closeMobileMenu}
                    className="flex min-h-[var(--touch-target)] items-center gap-2 rounded-lg px-3 text-fluid-sm font-semibold text-[#004E97] touch-manipulation hover:bg-[#eef3f8]"
                  >
                    <FiGrid className="h-4 w-4 shrink-0" />
                    Kategoriler
                  </Link>
                </li>
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={`flex min-h-[var(--touch-target)] items-center rounded-lg px-3 text-fluid-sm font-semibold touch-manipulation hover:bg-[#eef3f8] ${
                        link.highlight ? 'text-[#004E97]' : 'text-gray-800'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mb-2 text-fluid-xs font-bold uppercase tracking-wide text-gray-500">Kategoriler</p>
              <ul className="mb-6 space-y-1">
                {GROCERY_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/search?category=${encodeURIComponent(cat)}`}
                      onClick={closeMobileMenu}
                      className="flex min-h-[var(--touch-target)] items-center rounded-lg px-3 text-fluid-sm text-gray-700 touch-manipulation hover:bg-[#eef3f8] hover:text-[#004E97]"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mb-2 text-fluid-xs font-bold uppercase tracking-wide text-gray-500">Sepet</p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/cart"
                    onClick={closeMobileMenu}
                    className="flex min-h-[var(--touch-target)] items-center gap-2 rounded-lg px-3 text-fluid-sm font-semibold text-gray-800 touch-manipulation hover:bg-[#eef3f8]"
                  >
                    <FiShoppingCart className="h-4 w-4 shrink-0" />
                    Sepetim
                    {cartCount > 0 && (
                      <span className="rounded-full bg-[#E2001A] px-2 py-0.5 text-[0.625rem] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
