'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AdminLogSoundListener from '@/components/admin/AdminLogSoundListener';
import { AdminLiveProvider } from '@/components/admin/AdminLiveProvider';
import { getAdminSession } from '@/lib/adminAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== '/admin/login') {
      const admin = getAdminSession();
      if (admin) {
        setIsAuthenticated(true);
      } else {
        router.push('/admin/login');
      }
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="admin-panel flex min-h-screen items-center justify-center bg-[#08090d]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/admin/login') {
    return null;
  }

  if (pathname === '/admin/login') {
    return <div className="admin-panel min-h-screen bg-[#08090d]">{children}</div>;
  }

  return (
    <AdminLiveProvider>
      <div className="admin-panel min-h-screen bg-[#08090d] text-gray-200">
        <AdminLogSoundListener />
        <AdminTopNav />
        <main className="w-full px-3 py-4 sm:px-5 lg:px-6 xl:px-8">{children}</main>
      </div>
    </AdminLiveProvider>
  );
}
