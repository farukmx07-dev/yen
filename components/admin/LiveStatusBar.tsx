'use client';

import { FiHome, FiPackage, FiShoppingCart, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { getLiveStatusRoutes } from '@/lib/storeProductIds';
import { normalizeStoreMode, STORE_THEMES, type StoreMode } from '@/lib/storeThemes';

export interface VisitorStats {
  total: number;
  homepage: number;
  productDetail: number;
  cart: number;
  payment: number;
  address?: number;
}

interface LiveStatusBarProps {
  stats: VisitorStats;
  storeMode?: StoreMode;
}

export default function LiveStatusBar({ stats, storeMode = 'a101' }: LiveStatusBarProps) {
  const mode = normalizeStoreMode(storeMode);
  const routes = getLiveStatusRoutes(mode);
  const storeLabel = STORE_THEMES[mode].label;
  const hasOnline = stats.total > 0;

  const items = [
    {
      key: 'homepage' as const,
      label: 'Ana Sayfa',
      route: routes.homepage,
      icon: FiHome,
      color: 'text-orange-400',
    },
    {
      key: 'productDetail' as const,
      label: 'Ürün Detay',
      route: routes.productDetail,
      icon: FiPackage,
      color: 'text-purple-400',
    },
    {
      key: 'cart' as const,
      label: 'Sepet',
      route: routes.cart,
      icon: FiShoppingCart,
      color: 'text-blue-400',
    },
    {
      key: 'address' as const,
      label: 'Adres',
      route: routes.address,
      icon: FiMapPin,
      color: 'text-pink-400',
    },
    {
      key: 'payment' as const,
      label: 'Ödeme / 3D',
      route: routes.payment,
      icon: FiCreditCard,
      color: 'text-green-400',
    },
  ];

  return (
    <div className="rounded-xl border border-[#1e2433] bg-[#0f1117] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-white">Canlı Durum</h2>
          <span
            className={`h-2 w-2 rounded-full ${hasOnline ? 'animate-pulse bg-emerald-400' : 'bg-gray-600'}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300">
            {storeLabel}
          </span>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-400">
            Toplam: {stats.total} online
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const value =
            item.key === 'address'
              ? stats.address ?? 0
              : stats[item.key as keyof VisitorStats];
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-[#1e2433] bg-[#08090d] px-3 py-2.5"
            >
              <Icon className={`${item.color} shrink-0`} size={20} />
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-400">{item.label}</p>
                <p className="truncate text-xs text-gray-600" title={item.route}>
                  {item.route}
                </p>
                <p className={`text-xl font-bold ${item.color}`}>{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
