'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiShoppingCart,
  FiChevronDown,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { trackTikTok } from '@/lib/tiktokPixel';
import BimLogo from '@/components/Logos/BimLogo';

const NAV_LINKS = [
  { label: 'Ürünler', href: '/products' },
  { label: 'BİM\'e Özel', href: '/products?firsat=1', highlight: true },
  { label: 'Afişler', href: '/products' },
  { label: 'Mağazalar', href: '/products' },
  { label: 'İletişim', href: '/products' },
];

export default function BimMarketHeader() {
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
      <div className="bg-[#ED1C24] py-1">
        <div className="container mx-auto px-[var(--container-padding)]">
          <p className="text-center text-[10px] font-semibold text-white sm:text-xs">
            BİM Aktüel Ürünler — Her hafta yeni fırsatlar
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-2 sm:py-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/products" className="shrink-0 touch-manipulation" aria-label="BİM Ana Sayfa">
              <BimLogo />
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`shrink-0 touch-manipulation px-2 py-2 text-fluid-xs font-semibold min-h-[var(--touch-target)] inline-flex items-center xl:px-3 xl:text-fluid-sm ${
                    link.highlight ? 'text-[#ED1C24]' : 'text-gray-700 hover:text-[#ED1C24]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full border border-gray-200 text-[#ED1C24] touch-manipulation hover:border-[#ED1C24] lg:hidden"
                aria-label="Menüyü aç"
              >
                <FiMenu className="h-5 w-5" />
              </button>
              <Link
                href="/cart"
                className="relative inline-flex min-h-[var(--touch-target)] items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-2 text-fluid-xs font-semibold text-gray-800 touch-manipulation hover:border-[#ED1C24] sm:px-3"
              >
                <FiShoppingCart className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span className="hidden max-w-[5.5rem] truncate sm:inline">
                  {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                </span>
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ED1C24] text-[0.625rem] font-bold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-2 lg:mt-3">
            <div className="flex min-w-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
              <div className="relative min-w-0 flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  enterKeyHint="search"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 bg-transparent py-2.5 pl-9 pr-2 text-fluid-xs focus:outline-none sm:py-3 sm:text-fluid-sm"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 touch-manipulation bg-[#ED1C24] px-4 text-fluid-xs font-bold text-white hover:bg-[#C4000F] min-h-[var(--touch-target)] sm:px-6 sm:text-fluid-sm"
              >
                Ara
              </button>
            </div>
          </form>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={closeMobileMenu} aria-label="Kapat" />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#ED1C24] px-4 py-3">
              <BimLogo className="brightness-0 invert" />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full bg-white/20 text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="block rounded-lg px-3 py-2.5 text-fluid-sm font-semibold text-gray-800 touch-manipulation hover:bg-red-50 hover:text-[#ED1C24]"
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
