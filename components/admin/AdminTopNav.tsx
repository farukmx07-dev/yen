'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  FiHome,
  FiFileText,
  FiActivity,
  FiPackage,
  FiCrosshair,
  FiShield,
  FiPlusCircle,
  FiLogOut,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi';
import { clearAdminSession, getAdminSession, isSuperAdmin } from '@/lib/adminAuth';

const baseNavItems = [
  { name: 'Ana Sayfa', href: '/admin/dashboard', icon: FiHome },
  { name: 'Loglar', href: '/admin/logs', icon: FiFileText },
  { name: 'Admin Logları', href: '/admin/admin-logs', icon: FiActivity },
  { name: 'Ürünler', href: '/admin/products', icon: FiPackage },
  { name: 'Piksel', href: '/admin/pixel', icon: FiCrosshair },
  { name: 'Güvenlik', href: '/admin/security', icon: FiShield },
  { name: 'Yeni Ürün Ekle', href: '/admin/products/new', icon: FiPlusCircle },
];

interface AdminTopNavProps {
  onRefresh?: () => void;
  pageTitle?: string;
}

export default function AdminTopNav({ onRefresh, pageTitle }: AdminTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [master, setMaster] = useState(false);

  useEffect(() => {
    setMaster(isSuperAdmin(getAdminSession()));
  }, [pathname]);

  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    items.splice(6, 0, {
      name: master ? 'Yöneticiler' : 'Hesabım',
      href: '/admin/admins',
      icon: FiUsers,
    });
    return items;
  }, [master]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href;
    if (href === '/admin/products/new') return pathname === href;
    return pathname?.startsWith(href.split('?')[0]) && href !== '/admin/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2433] bg-[#08090d]">
      <div className="flex w-full items-center justify-between gap-4 px-3 py-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-base font-black text-white">A</span>
          </div>
          <span className="hidden text-base font-bold text-white sm:inline">admin</span>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-1 overflow-x-auto xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-[#1a1f2b] hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <FiLogOut size={16} />
            Çıkış Yap
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {pageTitle && (
            <span className="hidden text-base text-gray-400 md:inline">{pageTitle}</span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 rounded-lg border border-[#2a3142] bg-[#151922] px-3.5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-blue-500/40 hover:text-white"
            >
              <FiRefreshCw size={16} />
              Yenile
            </button>
          )}
        </div>
      </div>

      <nav className="flex w-full gap-1 overflow-x-auto border-t border-[#1e2433] px-3 py-2 xl:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'
              }`}
            >
              <Icon size={14} />
              {item.name}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-400"
        >
          Çıkış
        </button>
      </nav>
    </header>
  );
}
