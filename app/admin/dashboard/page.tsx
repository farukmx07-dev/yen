'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { FiFileText, FiShoppingCart, FiRefreshCw, FiCheck, FiLoader } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import LiveStatusBar from '@/components/admin/LiveStatusBar';
import CampaignManager from '@/components/admin/CampaignManager';
import { useAdminLive } from '@/components/admin/AdminLiveProvider';
import { STORE_THEMES, normalizeStoreMode, type StoreMode } from '@/lib/storeThemes';
import { playTestNotificationSound, setAdminNotificationVolume } from '@/lib/adminNotificationSound';
import { adminApiFetch } from '@/lib/adminAuth';
import type { PublicSettingsSnapshot } from '@/lib/publicSettings';
import { onSettingsUpdate, emitSettingsUpdate } from '@/lib/settingsRuntime';

interface Settings {
  campaignStartDate?: string;
  campaignEndDate?: string;
  businessName: string;
  siteActive: boolean;
  mobileOnly?: boolean;
  blockDebitCards?: boolean;
  adminSoundEnabled?: boolean;
  adminSoundVolume?: number;
  storeMode?: StoreMode;
  inactiveRedirectUrl?: string;
}

interface CampaignProduct {
  _id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  featured: boolean;
  category?: { name?: string };
}

function applySettingsFromApi(raw: Record<string, unknown>): Settings {
  return {
    businessName: typeof raw.businessName === 'string' ? raw.businessName : 'A101',
    siteActive: raw.siteActive !== false,
    mobileOnly: raw.mobileOnly === true,
    blockDebitCards: raw.blockDebitCards === true,
    adminSoundEnabled: raw.adminSoundEnabled !== false,
    adminSoundVolume:
      typeof raw.adminSoundVolume === 'number'
        ? Math.max(0, Math.min(100, Math.round(raw.adminSoundVolume)))
        : 80,
    storeMode: normalizeStoreMode(raw.storeMode),
    campaignStartDate:
      typeof raw.campaignStartDate === 'string' ? raw.campaignStartDate : undefined,
    campaignEndDate: typeof raw.campaignEndDate === 'string' ? raw.campaignEndDate : undefined,
    inactiveRedirectUrl:
      typeof raw.inactiveRedirectUrl === 'string' ? raw.inactiveRedirectUrl : undefined,
  };
}

export default function Dashboard() {
  const { showToast } = useToast();
  const { visitorStats, logs, refresh: refreshLiveData } = useAdminLive();
  const [products, setProducts] = useState<CampaignProduct[]>([]);
  const [settings, setSettings] = useState<Settings>({
    businessName: 'A101',
    siteActive: true,
    mobileOnly: false,
    blockDebitCards: false,
    adminSoundEnabled: true,
    adminSoundVolume: 80,
    storeMode: 'a101',
  });
  const [loading, setLoading] = useState(true);
  const [storeModeSaving, setStoreModeSaving] = useState(false);
  const [redirectUrlDraft, setRedirectUrlDraft] = useState('');
  const [redirectUrlSaving, setRedirectUrlSaving] = useState(false);
  const settingsSaveInFlightRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    try {
      const settingsRes = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });

      if (settingsSaveInFlightRef.current) return;

      const settingsData = await settingsRes.json();

      if (settingsData.success) {
        const next = applySettingsFromApi(settingsData.data);
        setSettings(next);
        setRedirectUrlDraft(next.inactiveRedirectUrl || '');
      }
    } catch (error) {
      console.error('Ayar yükleme hatası:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const productsRes = await fetch('/api/products', { cache: 'no-store' });
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data || []);
      }
    } catch (error) {
      console.error('Ürün verisi yüklenemedi:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSettings(), fetchProducts(), refreshLiveData()]);
    } finally {
      setLoading(false);
    }
  }, [fetchSettings, fetchProducts, refreshLiveData]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    return onSettingsUpdate((snapshot: PublicSettingsSnapshot) => {
      if (settingsSaveInFlightRef.current) return;
      setSettings((prev) => ({
        ...prev,
        siteActive: snapshot.siteActive !== false,
        mobileOnly: snapshot.mobileOnly === true,
        storeMode: snapshot.storeMode ? normalizeStoreMode(snapshot.storeMode) : prev.storeMode,
        inactiveRedirectUrl:
          typeof snapshot.inactiveRedirectUrl === 'string'
            ? snapshot.inactiveRedirectUrl
            : prev.inactiveRedirectUrl,
        blockDebitCards:
          snapshot.blockDebitCards === true ? true : snapshot.blockDebitCards === false ? false : prev.blockDebitCards,
      }));
      if (typeof snapshot.inactiveRedirectUrl === 'string') {
        setRedirectUrlDraft(snapshot.inactiveRedirectUrl);
      }
    });
  }, []);

  const updateSettings = async (payload: Partial<Settings>) => {
    const res = await adminApiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      const next = applySettingsFromApi(data.data);
      setSettings(next);
      emitSettingsUpdate(data.data as PublicSettingsSnapshot);
      return true;
    }
    return false;
  };

  const handleToggleSite = async () => {
    const next = !settings.siteActive;
    settingsSaveInFlightRef.current = true;
    setSettings((prev) => ({ ...prev, siteActive: next }));
    try {
      const ok = await updateSettings({ siteActive: next });
      if (!ok) {
        setSettings((prev) => ({ ...prev, siteActive: !next }));
        showToast('Ayar güncellenemedi', 'error');
        return;
      }
      showToast(`Site ${next ? 'aktif' : 'pasif'} edildi`, 'success');
    } finally {
      settingsSaveInFlightRef.current = false;
    }
  };

  const handleSaveRedirectUrl = async () => {
    setRedirectUrlSaving(true);
    settingsSaveInFlightRef.current = true;
    try {
      const ok = await updateSettings({
        inactiveRedirectUrl: redirectUrlDraft.trim() || '',
      });
      showToast(ok ? 'Yönlendirme URL kaydedildi' : 'Ayar güncellenemedi', ok ? 'success' : 'error');
    } finally {
      settingsSaveInFlightRef.current = false;
      setRedirectUrlSaving(false);
    }
  };

  const handleToggleMobile = async () => {
    const next = !settings.mobileOnly;
    setSettings((prev) => ({ ...prev, mobileOnly: next }));
    const ok = await updateSettings({ mobileOnly: next });
    if (!ok) {
      setSettings((prev) => ({ ...prev, mobileOnly: !next }));
      showToast('Ayar güncellenemedi', 'error');
      return;
    }
    showToast(`Sadece telefona aç ${next ? 'açıldı' : 'kapatıldı'}`, 'success');
  };

  const handleToggleBlockDebit = async () => {
    const ok = await updateSettings({ blockDebitCards: !settings.blockDebitCards });
    showToast(
      ok
        ? `Banka kartı engeli ${!settings.blockDebitCards ? 'açıldı' : 'kapatıldı'}`
        : 'Ayar güncellenemedi',
      ok ? 'success' : 'error'
    );
  };

  const handleToggleAdminSound = async () => {
    const ok = await updateSettings({ adminSoundEnabled: !settings.adminSoundEnabled });
    showToast(
      ok
        ? `Bildirim sesi ${!settings.adminSoundEnabled ? 'açıldı' : 'kapatıldı'}`
        : 'Ayar güncellenemedi',
      ok ? 'success' : 'error'
    );
  };

  const handleAdminSoundVolumeChange = (volume: number) => {
    const nextVolume = Math.max(0, Math.min(100, Math.round(volume)));
    setSettings((prev) => ({ ...prev, adminSoundVolume: nextVolume }));
    setAdminNotificationVolume(nextVolume);
  };

  const handleAdminSoundVolumeSave = async () => {
    const ok = await updateSettings({ adminSoundVolume: settings.adminSoundVolume ?? 80 });
    if (!ok) {
      showToast('Ses seviyesi kaydedilemedi', 'error');
    }
  };

  const handleTestAdminSound = () => {
    setAdminNotificationVolume(settings.adminSoundVolume ?? 80);
    playTestNotificationSound();
  };

  const handleStoreModeChange = async (mode: StoreMode) => {
    const currentMode = normalizeStoreMode(settings.storeMode);
    if (currentMode === mode || storeModeSaving) return;

    setStoreModeSaving(true);
    setSettings((prev) => ({ ...prev, storeMode: mode }));

    try {
      const ok = await updateSettings({ storeMode: mode });
      if (ok) {
        showToast(`Mağaza modu kaydedildi: ${STORE_THEMES[mode].label}`, 'success');
      } else {
        setSettings((prev) => ({ ...prev, storeMode: currentMode }));
        showToast('Mod kaydedilemedi', 'error');
      }
    } catch {
      setSettings((prev) => ({ ...prev, storeMode: currentMode }));
      showToast('Mod kaydedilemedi', 'error');
    } finally {
      setStoreModeSaving(false);
    }
  };

  const handleSaveCampaignDates = async (payload: {
    campaignStartDate?: string | null;
    campaignEndDate?: string | null;
  }) => {
    const ok = await updateSettings(payload as Partial<Settings>);
    showToast(ok ? 'Kampanya tarihleri kaydedildi' : 'Kaydedilemedi', ok ? 'success' : 'error');
    return ok;
  };

  const handleApplyFeatured = async (featuredIds: string[]) => {
    const selectedSet = new Set(featuredIds);
    const toUpdate = products.filter((p) => p.featured !== selectedSet.has(p._id));

    if (toUpdate.length === 0) {
      showToast('Kampanya ürünleri güncellendi', 'success');
      return true;
    }

    try {
      const results = await Promise.all(
        toUpdate.map((p) =>
          fetch(`/api/products/${p._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featured: selectedSet.has(p._id) }),
          }).then((res) => res.json())
        )
      );

      if (results.some((r) => !r.success)) {
        showToast('Bazı ürünler güncellenemedi', 'error');
        return false;
      }

      setProducts((prev) =>
        prev.map((p) => ({ ...p, featured: selectedSet.has(p._id) }))
      );
      showToast(`${featuredIds.length} kampanyalı ürün kaydedildi`, 'success');
      return true;
    } catch {
      showToast('Kampanya ürünleri kaydedilemedi', 'error');
      return false;
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
        <h1 className="text-2xl font-bold text-white">Ana Sayfa</h1>
        <button
          onClick={() => void fetchAll()}
          className="flex items-center gap-2 rounded-lg border border-[#2a3142] bg-[#151922] px-3.5 py-2.5 text-sm text-gray-300 hover:text-white"
        >
          <FiRefreshCw size={16} />
          Yenile
        </button>
      </div>

      <LiveStatusBar stats={visitorStats} storeMode={normalizeStoreMode(settings.storeMode)} />

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Mağaza Modu</h3>
          {storeModeSaving ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
              <FiLoader className="animate-spin" size={14} />
              Kaydediliyor...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <FiCheck size={14} />
              Aktif: {STORE_THEMES[normalizeStoreMode(settings.storeMode)].label}
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Sitenin görünümünü seçin. Seçim anında kaydedilir; F5 sonrası da aynı mod görünür.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.values(STORE_THEMES) as (typeof STORE_THEMES)[StoreMode][]).map((theme) => {
            const active = normalizeStoreMode(settings.storeMode) === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                disabled={storeModeSaving}
                onClick={() => handleStoreModeChange(theme.id)}
                className={`rounded-xl border p-4 text-left transition-all disabled:cursor-wait disabled:opacity-70 ${
                  active
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                    : 'border-[#2a3142] bg-[#0d1017] hover:border-gray-500'
                }`}
              >
                <div
                  className="mb-3 flex h-10 items-center rounded-lg px-3 font-black"
                  style={{ backgroundColor: theme.headerBg, color: theme.headerText }}
                >
                  {theme.shortLabel}
                </div>
                <p className="font-semibold text-white">{theme.label}</p>
                <p className="mt-1 text-xs text-gray-500">{theme.tagline || 'Mevcut A101 tasarımı'}</p>
                {active && <p className="mt-2 text-xs font-semibold text-blue-400">Aktif mod</p>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base text-gray-400">Loglar</span>
            <FiFileText className="text-blue-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-blue-400">{logs.length}</p>
          <p className="mt-1 text-sm text-gray-500">Toplam log sayısı</p>
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base text-gray-400">Aktif Sepet Sayısı</span>
            <FiShoppingCart className="text-emerald-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{visitorStats.cart}</p>
          <p className="mt-1 text-sm text-gray-500">Son 30 dk içinde sepetinde ürün olan kullanıcı</p>
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base text-gray-400">Site Durumu</span>
            <button
              onClick={handleToggleSite}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.siteActive ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.siteActive ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <p className={`text-lg font-bold ${settings.siteActive ? 'text-emerald-400' : 'text-gray-400'}`}>
            {settings.siteActive ? 'Aktif' : 'Pasif'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Pasifken tüm ziyaretçiler Wikipedia (veya aşağıdaki URL) adresine yönlendirilir. Aktifken mağaza
            açılır. Değişiklik anında WebSocket ile yayınlanır.
          </p>
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5 md:col-span-2">
          <h3 className="mb-2 text-base font-semibold text-white">Ana URL Yönlendirme Adresi</h3>
          <p className="mb-4 text-sm text-gray-500">
            Ziyaretçi site ana adresine geldiğinde bu URL&apos;ye yönlendirilir. Boş bırakılırsa varsayılan Wikipedia
            sayfası kullanılır.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={redirectUrlDraft}
              onChange={(e) => setRedirectUrlDraft(e.target.value)}
              placeholder="https://tr.wikipedia.org/wiki/..."
              className="min-w-0 flex-1 rounded-lg border border-[#2a3142] bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSaveRedirectUrl()}
              disabled={redirectUrlSaving}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {redirectUrlSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-[#151922] p-5 md:col-span-2 xl:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base font-semibold text-amber-300">Banka Kartı Engeli</span>
            <button
              onClick={handleToggleBlockDebit}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.blockDebitCards ? 'bg-amber-500' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.blockDebitCards ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <p className={`text-lg font-bold ${settings.blockDebitCards ? 'text-amber-400' : 'text-gray-400'}`}>
            {settings.blockDebitCards ? 'Açık' : 'Kapalı'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Açıkken debit BIN girildiğinde &quot;Banka kartları desteklenmemektedir&quot; uyarısı çıkar ve ödeme
            engellenir.
          </p>
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base text-gray-400">Admin Bildirim Sesi</span>
            <button
              onClick={handleToggleAdminSound}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.adminSoundEnabled !== false ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.adminSoundEnabled !== false ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <p className={`text-lg font-bold ${settings.adminSoundEnabled !== false ? 'text-blue-400' : 'text-gray-400'}`}>
            {settings.adminSoundEnabled !== false ? 'Açık' : 'Kapalı'}
          </p>
          {settings.adminSoundEnabled !== false && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Ses Seviyesi</span>
                <span className="font-medium text-white">{settings.adminSoundVolume ?? 80}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.adminSoundVolume ?? 80}
                onChange={(e) => handleAdminSoundVolumeChange(Number(e.target.value))}
                onMouseUp={() => void handleAdminSoundVolumeSave()}
                onTouchEnd={() => void handleAdminSoundVolumeSave()}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#2a3142] accent-blue-500"
              />
              <button
                type="button"
                onClick={handleTestAdminSound}
                className="text-sm text-blue-400 transition-colors hover:text-blue-300"
              >
                Sesi dene
              </button>
            </div>
          )}
            <p className="mt-1 text-sm text-gray-500">
              Yeni log ve 3D Secure kodu geldiğinde sesli bildirim çalar. Başka sekmedeyken masaüstü
              bildirimi de gösterilir (panelde bir kez tıklayıp izin verin).
            </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
        <h3 className="mb-4 text-base font-semibold text-white">Sadece Telefona Aç</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-lg font-bold ${settings.mobileOnly ? 'text-blue-400' : 'text-gray-400'}`}>
              {settings.mobileOnly ? 'Açık' : 'Kapalı'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Açıkken sadece telefon ve tablet erişebilir. Bilgisayardan girenler site kapalıyken
              yönlendirilen adrese gider.
            </p>
          </div>
          <button
            onClick={handleToggleMobile}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.mobileOnly ? 'bg-blue-500' : 'bg-gray-600'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.mobileOnly ? 'left-[22px]' : 'left-0.5'}`}
            />
          </button>
        </div>
      </div>

      <CampaignManager
        settings={settings}
        products={products}
        onSaveDates={handleSaveCampaignDates}
        onApplyFeatured={handleApplyFeatured}
      />
    </div>
  );
}
