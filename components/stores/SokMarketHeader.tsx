'use client';

import Link from 'next/link';
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
import SokMarketLogo from '@/components/Logos/SokMarketLogo';

const TOP_LINKS = [
  { label: 'Kampanyalar', href: '/products?firsat=1', accent: true },
  { label: 'Kurumsal', href: '/products' },
  { label: 'Yatırımcı İlişkileri', href: '/products' },
];

const NAV_LINKS = [
  { label: 'Kampanyalar', href: '/products?firsat=1', highlight: true },
  { label: 'Kataloglar', href: '/products' },
  { label: 'Cepte Şok', href: '/products' },
];

const GROCERY_CATEGORIES = [
  'Meyve, Sebze',
  'Et, Tavuk, Balık',
  'Süt, Kahvaltılık',
  'Temel Gıda',
  'İçecekler',
  'Temizlik',
  'Kişisel Bakım',
  'Bebek',
];

export default function SokMarketHeader() {
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
      <div className="hidden border-b border-[#0d1854] bg-[#1a237e] sm:block">
        <div className="container mx-auto flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-[var(--container-padding)] py-1.5 text-fluid-xs text-white/90">
          {TOP_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`shrink-0 touch-manipulation hover:text-white ${link.accent ? 'font-semibold text-[#FFD100]' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-b border-[#e6bc00] bg-[#FFD100]">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-2 sm:py-3">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <div className="flex min-w-0 items-center justify-between gap-2 lg:shrink-0 lg:justify-start">
              <Link
                href="/products"
                className="inline-flex min-w-0 shrink-0 items-center touch-manipulation"
                aria-label="Cepte Şok Ana Sayfa"
              >
                <SokMarketLogo />
              </Link>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full border border-[#E30613]/25 bg-white text-[#E30613] shadow-sm touch-manipulation hover:border-[#E30613]"
                  aria-label="Menüyü aç"
                >
                  <FiMenu className="h-5 w-5" />
                </button>

                <Link
                  href="/cart"
                  className="relative inline-flex min-h-[var(--touch-target)] items-center gap-1 rounded-full border border-[#E30613]/25 bg-white py-2 pl-2.5 pr-2 text-fluid-xs font-semibold text-gray-800 shadow-sm touch-manipulation hover:border-[#E30613] xs:gap-1.5 xs:px-3"
                  aria-label={`Sepetim${cartCount > 0 ? `, ${cartCount} ürün` : ''}`}
                >
                  <FiShoppingCart className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" />
                  <span className="hidden max-w-[5rem] truncate xs:inline sm:max-w-[6.5rem]">
                    {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                  </span>
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#E30613] px-0.5 text-[0.625rem] font-bold leading-none text-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <form onSubmit={handleSearch} className="min-w-0 w-full flex-1">
              <div className="flex min-w-0 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
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
                  className="shrink-0 touch-manipulation bg-[#E30613] px-4 text-fluid-xs font-bold text-white hover:bg-[#c40510] min-h-[var(--touch-target)] sm:px-6 sm:text-fluid-sm"
                >
                  Ara
                </button>
              </div>
            </form>

            <div className="hidden min-w-0 items-center gap-2 lg:flex lg:shrink-0">
              <Link
                href="/cart"
                className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-[#E30613]/30 bg-white px-3 py-2 text-fluid-xs font-semibold text-gray-800 touch-manipulation hover:border-[#E30613] min-h-[var(--touch-target)]"
              >
                <FiShoppingCart className="h-5 w-5 shrink-0" />
                <span className="max-w-[7rem] truncate xl:max-w-none">
                  {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                </span>
                <FiChevronDown className="hidden h-3 w-3 shrink-0 xl:block" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E30613] text-[0.625rem] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-gray-200 bg-white lg:block">
        <div className="container mx-auto flex min-w-0 items-center gap-1 px-[var(--container-padding)] py-2">
          <Link
            href="/products"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#E30613] px-3 py-2 text-fluid-xs font-bold text-white touch-manipulation hover:bg-[#c40510] min-h-[var(--touch-target)]"
          >
            <FiGrid className="h-4 w-4" />
            Kategoriler
          </Link>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`shrink-0 touch-manipulation px-3 py-2 text-fluid-xs font-semibold min-h-[var(--touch-target)] inline-flex items-center ${
                link.highlight ? 'text-[#E30613]' : 'text-gray-700 hover:text-[#E30613]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Mobil menü">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
            aria-label="Menüyü kapat"
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#FFD100] px-4 py-3">
              <SokMarketLogo />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700"
                aria-label="Kapat"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-fluid-xs font-bold uppercase tracking-wide text-gray-500">Kategoriler</p>
              <ul className="space-y-1">
                {GROCERY_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      href="/products"
                      onClick={closeMobileMenu}
                      className="block rounded-lg px-3 py-2.5 text-fluid-sm font-medium text-gray-800 touch-manipulation hover:bg-[#fff8d6]"
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mb-2 mt-6 text-fluid-xs font-bold uppercase tracking-wide text-gray-500">Menü</p>
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="block rounded-lg px-3 py-2.5 text-fluid-sm font-semibold text-[#E30613] touch-manipulation hover:bg-[#fff8d6]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
