'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import { adminApiFetch } from '@/lib/adminAuth';
import { ADMIN_POLL_MS } from '@/lib/constants';

export default function AdminPixelPage() {
  const { showToast } = useToast();
  const [pixelCode, setPixelCode] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isDirtyRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && !isDirtyRef.current) {
        setPixelCode(data.data?.pixelCode || '');
        setTiktokPixelId(data.data?.tiktokPixelId || '');
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, ADMIN_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ pixelCode, tiktokPixelId }),
      });
      const data = await res.json();
      if (data.success) {
        isDirtyRef.current = false;
        setPixelCode(data.data?.pixelCode || '');
        setTiktokPixelId(data.data?.tiktokPixelId || '');
        showToast('Piksel ayarları kaydedildi', 'success');
      } else {
        showToast('Kaydedilemedi', 'error');
      }
    } catch {
      showToast('Kaydedilemedi', 'error');
    } finally {
      setSaving(false);
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
      <div className="flex items-center gap-2">
        <FiFileText className="text-gray-400" size={20} />
        <h1 className="text-xl font-bold text-white">Piksel</h1>
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">TikTok Pixel ID</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          TikTok Events Manager&apos;dan aldığınız Pixel ID&apos;yi girin. Site genelinde otomatik
          yüklenir; tüm buton tıklamaları, sepete ekleme, ödeme ve satın alma event&apos;leri gönderilir.
        </p>

        <input
          type="text"
          value={tiktokPixelId}
          onChange={(e) => {
            isDirtyRef.current = true;
            setTiktokPixelId(e.target.value);
          }}
          placeholder="D8S63EBC77U2T659NL40"
          spellCheck={false}
          className="mt-4 w-full rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 font-mono text-sm text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Ek Piksel Kodu (Meta vb.)</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Meta veya diğer piksel kodunu olduğu gibi yapıştırın. Kaydettiğinizde kod doğrudan
          sitenin HTML head bölümüne eklenir ve ziyaretçi sayfalarında çalışır.
        </p>

        <textarea
          value={pixelCode}
          onChange={(e) => {
            isDirtyRef.current = true;
            setPixelCode(e.target.value);
          }}
          rows={14}
          spellCheck={false}
          placeholder="<!-- Meta Pixel Code Start -->"
          className="mt-4 w-full resize-y rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3 font-mono text-xs leading-relaxed text-gray-200 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
