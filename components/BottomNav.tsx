'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiHome, FiShoppingCart, FiGift } from 'react-icons/fi';
import { usePathname, useSearchParams } from 'next/navigation';
import CartBadge from './CartBadge';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirsatOpen = searchParams.get('firsat') === '1';
  const [campaignCount, setCampaignCount] = useState(0);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCampaignCount((data.data as { featured?: boolean }[]).filter((p) => p.featured).length);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    {
      href: '/products',
      icon: FiHome,
      label: 'Ana Sayfa',
      match: (path: string) =>
        (path === '/products' || path.startsWith('/products') || path === '/') && !isFirsatOpen,
    },
    {
      href: '/products?firsat=1',
      icon: FiGift,
      label: 'Kampanyalar',
      badgeCount: campaignCount,
      match: () => isFirsatOpen || pathname.startsWith('/kampanyalar'),
    },
    {
      href: '/cart',
      icon: FiShoppingCart,
      label: 'Sepetim',
      badge: true,
      match: (path: string) => path.startsWith('/cart'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full min-w-0 overflow-x-clip border-t-2 border-gray-200 bg-white shadow-2xl safe-area-inset-bottom md:hidden">
      <div className="flex max-w-full items-center justify-around px-2 py-1.5 sm:px-4 sm:py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] min-w-0 max-w-[33%] flex-1 flex-col items-center justify-center space-y-0.5 rounded-lg px-2 py-1 transition-all duration-300 touch-manipulation sm:min-h-[48px] sm:space-y-1 sm:px-3 ${
                isActive
                  ? 'bg-a101-teal/10 text-a101-teal'
                  : 'text-gray-600 hover:text-a101-teal active:bg-gray-50 active:text-a101-teal'
              }`}
            >
              <div className="relative">
                <Icon size={18} className={`sm:h-5 sm:w-5 ${isActive ? 'text-a101-teal' : ''}`} />
                {item.badge && <CartBadge />}
                {item.badgeCount != null && item.badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[9px] font-semibold sm:text-[10px] ${isActive ? 'text-a101-teal' : 'text-gray-600'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
