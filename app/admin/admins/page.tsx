'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiKey, FiPlus, FiShield, FiTrash2, FiUser } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
  adminApiFetch,
  getAdminSession,
  isSuperAdmin,
  type AdminSession,
} from '@/lib/adminAuth';

interface PublicAdmin {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'admin' as 'admin' | 'superadmin',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [admins, setAdmins] = useState<PublicAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<PublicAdmin | null>(null);

  useEffect(() => {
    const current = getAdminSession();
    if (!current) {
      router.push('/admin/login');
      return;
    }
    setSession(current);
  }, [router]);

  const fetchAdmins = useCallback(async () => {
    if (!isSuperAdmin(session)) {
      setLoading(false);
      return;
    }

    try {
      const res = await adminApiFetch(`/api/admin/admins?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data || []);
      } else {
        showToast(data.error || 'Admin listesi alınamadı', 'error');
      }
    } catch {
      showToast('Admin listesi alınamadı', 'error');
    } finally {
      setLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    if (session) {
      void fetchAdmins();
    }
  }, [session, fetchAdmins]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApiFetch('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Admin eklendi', 'success');
        setForm(emptyForm);
        void fetchAdmins();
      } else {
        showToast(data.error || 'Admin eklenemedi', 'error');
      }
    } catch {
      showToast('Admin eklenemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await adminApiFetch(`/api/admin/admins/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Şifreniz güncellendi', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Şifre güncellenemedi', 'error');
      }
    } catch {
      showToast('Şifre güncellenemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await adminApiFetch(`/api/admin/admins/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Admin silindi', 'success');
        setDeleteTarget(null);
        void fetchAdmins();
      } else {
        showToast(data.error || 'Admin silinemedi', 'error');
      }
    } catch {
      showToast('Admin silinemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const master = isSuperAdmin(session);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FiShield className="text-gray-400" size={20} />
        <h1 className="text-xl font-bold text-white">Yönetici Hesapları</h1>
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FiKey className="text-blue-400" size={18} />
          <h2 className="text-base font-semibold text-white">Şifremi Değiştir</h2>
        </div>
        <form onSubmit={handleChangePassword} className="grid gap-4 md:grid-cols-3">
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="Mevcut şifre"
            required
            className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            placeholder="Yeni şifre"
            required
            minLength={6}
            className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
          />
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Yeni şifre tekrar"
            required
            minLength={6}
            className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
          />
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-3 w-fit rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            Şifreyi Güncelle
          </button>
        </form>
      </div>

      {master ? (
        <>
          <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <FiPlus className="text-emerald-400" size={18} />
              <h2 className="text-base font-semibold text-white">Yeni Admin Ekle</h2>
            </div>
            <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))}
                placeholder="Kullanıcı adı"
                required
                minLength={3}
                className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Şifre"
                required
                minLength={6}
                className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
              />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ad Soyad"
                className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="E-posta"
                className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white"
              />
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value as 'admin' | 'superadmin' }))
                }
                className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 text-sm text-white md:col-span-2"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Master Admin</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="md:col-span-2 w-fit rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Admin Ekle
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#2a3142] bg-[#151922]">
            <div className="border-b border-[#2a3142] px-5 py-4">
              <h2 className="text-base font-semibold text-white">Kayıtlı Adminler</h2>
            </div>
            {loading ? (
              <div className="flex h-40 items-center justify-center text-gray-500">Yükleniyor...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3142] text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">Kullanıcı</th>
                      <th className="px-5 py-3">E-posta</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin._id} className="border-b border-[#2a3142]/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FiUser className="text-gray-500" />
                            <div>
                              <p className="font-semibold text-white">{admin.username}</p>
                              <p className="text-xs text-gray-500">{admin.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-300">{admin.email}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              admin.role === 'superadmin'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-blue-500/15 text-blue-300'
                            }`}
                          >
                            {admin.role === 'superadmin' ? 'Master Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {admin._id !== session.id ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(admin)}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                            >
                              <FiTrash2 size={14} />
                              Sil
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">Siz</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 text-sm text-gray-400">
          Admin ekleme ve silme işlemleri yalnızca master admin hesabıyla yapılabilir.
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Admin Sil"
        message={`${deleteTarget?.username} kullanıcısını silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        loading={saving}
        onConfirm={handleDeleteAdmin}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
