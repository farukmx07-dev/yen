'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiLock, FiUser } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import { getAdminSession, setAdminSession } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const admin = getAdminSession();
    if (admin) router.push('/admin/dashboard');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminSession({
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
        showToast('Giriş başarılı!', 'success');
        router.push('/admin/dashboard');
      } else {
        showToast(data.error || 'Kullanıcı adı veya şifre hatalı', 'error');
      }
    } catch {
      showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-[#08090d]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#1e2433] bg-[#0f1117] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
              <span className="text-xl font-black text-white">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-500">Giriş yapın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">Kullanıcı Adı</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">Şifre</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
