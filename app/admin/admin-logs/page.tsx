'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiActivity, FiRefreshCw, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { adminApiFetch, isSuperAdmin, getAdminSession } from '@/lib/adminAuth';
import { ADMIN_POLL_MS } from '@/lib/constants';
import type { AdminActionLog } from '@/lib/db/types';

const CATEGORY_LABELS: Record<AdminActionLog['category'], string> = {
  settings: 'Ayarlar',
  security: 'Güvenlik',
  admin: 'Yönetici',
  store: 'Mağaza',
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('tr-TR');
}

function deviceLabel(log: AdminActionLog) {
  const parts = [log.deviceType, log.deviceModel, log.browser, log.os].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : '-';
}

export default function AdminActionLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [master, setMaster] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await adminApiFetch(`/api/admin/action-logs?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMaster(isSuperAdmin(getAdminSession()));
    void fetchLogs();
    const interval = setInterval(fetchLogs, ADMIN_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.summary.toLowerCase().includes(q) ||
      log.adminUsername.toLowerCase().includes(q) ||
      (log.ipAddress || '').toLowerCase().includes(q) ||
      (log.browser || '').toLowerCase().includes(q) ||
      (log.os || '').toLowerCase().includes(q) ||
      log.changes.some(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.oldValue.toLowerCase().includes(q) ||
          c.newValue.toLowerCase().includes(q)
      )
    );
  });

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    try {
      const res = await adminApiFetch('/api/admin/action-logs', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Admin logları silindi', 'success');
        setDeleteConfirm(false);
        setLogs([]);
      } else {
        showToast(data.error || 'Silinemedi', 'error');
      }
    } catch {
      showToast('Silinemedi', 'error');
    } finally {
      setDeleteLoading(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiActivity className="text-gray-400" size={20} />
          <h1 className="text-xl font-bold text-white">Admin Logları</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchLogs()}
            className="flex items-center gap-2 rounded-lg border border-[#2a3142] bg-[#151922] px-3.5 py-2 text-sm text-gray-300 hover:text-white"
          >
            <FiRefreshCw size={14} />
            Yenile
          </button>
          {master && (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-sm text-red-400 hover:bg-red-500/20"
            >
              <FiTrash2 size={14} />
              Tümünü Sil
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400">
        Mağaza modu, kampanya, site durumu, telefon modu, banka kartı engeli, admin sesi, piksel ve
        güvenlik ayarlarındaki değişiklikler kayıt altına alınır.
      </p>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Admin, IP, cihaz veya değişiklik ara..."
          className="w-full rounded-lg border border-[#2a3142] bg-[#151922] py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2a3142] bg-[#151922]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#2a3142] bg-[#0f1117] text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Değişiklik</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">Cihaz</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Kayıt bulunamadı
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id} className="border-b border-[#1e2433] hover:bg-[#1a1f2b]">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{log.adminUsername}</div>
                    <div className="text-xs text-gray-500">
                      {log.adminRole === 'superadmin' ? 'Master' : 'Admin'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{CATEGORY_LABELS[log.category]}</td>
                  <td className="px-4 py-3 text-gray-300">
                    <div className="max-w-md">{log.summary}</div>
                    {log.changes.length > 1 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                        {log.changes.map((change) => (
                          <li key={`${log._id}-${change.field}`}>
                            {change.label}: {change.oldValue} → {change.newValue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{deviceLabel(log)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        title="Tüm admin loglarını sil"
        message="Bu işlem geri alınamaz. Tüm admin işlem kayıtları silinecek."
        confirmLabel="Sil"
        cancelLabel="İptal"
        loading={deleteLoading}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}
