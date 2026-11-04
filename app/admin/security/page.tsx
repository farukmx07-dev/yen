'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiShield, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import { adminApiFetch } from '@/lib/adminAuth';
import { ADMIN_POLL_MS } from '@/lib/constants';

export default function AdminSecurityPage() {
  const { showToast } = useToast();
  const [bannedIps, setBannedIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIp, setRemovingIp] = useState<string | null>(null);

  const fetchBannedIps = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/banned-ips?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBannedIps(data.data || []);
      }
    } catch {
      // sessizce devam
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBannedIps();
    const interval = setInterval(fetchBannedIps, ADMIN_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchBannedIps]);

  const handleUnban = async (ip: string) => {
    setRemovingIp(ip);
    try {
      const res = await adminApiFetch('/api/admin/banned-ips', {
        method: 'DELETE',
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.success) {
        setBannedIps(data.data || []);
        showToast(`${ip} banı kaldırıldı`, 'success');
      } else {
        showToast(data.error || 'Ban kaldırılamadı', 'error');
      }
    } catch {
      showToast('Ban kaldırılamadı', 'error');
    } finally {
      setRemovingIp(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiShield className="text-gray-400" size={20} />
          <h1 className="text-xl font-bold text-white">Güvenlik</h1>
        </div>
        <button
          type="button"
          onClick={fetchBannedIps}
          className="flex items-center gap-2 rounded-lg border border-[#2a3142] bg-[#151922] px-3 py-2 text-xs text-gray-300 hover:text-white"
        >
          <FiRefreshCw size={14} />
          Yenile
        </button>
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Banlı IP Adresleri</h2>
            <p className="mt-1 text-sm text-gray-400">
              Loglardan banlanan IP&apos;ler burada listelenir. Ban kaldırılan IP tekrar siteye girebilir.
            </p>
          </div>
          <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
            {bannedIps.length} banlı IP
          </span>
        </div>

        {bannedIps.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-[#2a3142] bg-[#0f1117] px-4 py-10 text-center">
            <p className="text-sm text-gray-500">Şu an banlı IP adresi yok.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-[#2a3142]">
            <div className="hidden grid-cols-[1fr_auto] gap-4 border-b border-[#2a3142] bg-[#0f1117] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
              <span>IP Adresi</span>
              <span>İşlem</span>
            </div>
            <ul className="divide-y divide-[#2a3142]">
              {bannedIps.map((ip) => (
                <li
                  key={ip}
                  className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                >
                  <code className="rounded-md bg-[#0f1117] px-3 py-2 text-sm text-emerald-300">{ip}</code>
                  <button
                    type="button"
                    onClick={() => handleUnban(ip)}
                    disabled={removingIp === ip}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                  >
                    <FiTrash2 size={14} />
                    {removingIp === ip ? 'Kaldırılıyor...' : 'Ban Kaldır'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
