'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiStar, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import {
  formatCampaignDateTr,
  getCampaignStatus,
  parseDatetimeLocal,
  toDatetimeLocalValue,
  type CampaignStatus,
} from '@/lib/campaignUtils';
import { PRODUCT_PLACEHOLDER } from '@/lib/publicAssets';

interface CampaignProduct {
  _id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  featured: boolean;
  category?: { name?: string };
}

interface CampaignSettings {
  campaignStartDate?: string;
  campaignEndDate?: string;
}

interface CampaignManagerProps {
  settings: CampaignSettings;
  products: CampaignProduct[];
  onSaveDates: (payload: { campaignStartDate?: string | null; campaignEndDate?: string | null }) => Promise<boolean>;
  onApplyFeatured: (featuredIds: string[]) => Promise<boolean>;
}

const statusLabels: Record<CampaignStatus, { text: string; className: string }> = {
  unset: { text: 'Tarih ayarlanmadı', className: 'text-gray-400 bg-gray-500/10' },
  upcoming: { text: 'Yakında başlayacak', className: 'text-blue-400 bg-blue-500/10' },
  active: { text: 'Kampanya aktif', className: 'text-emerald-400 bg-emerald-500/10' },
  ended: { text: 'Kampanya bitti', className: 'text-red-400 bg-red-500/10' },
};

export default function CampaignManager({
  settings,
  products,
  onSaveDates,
  onApplyFeatured,
}: CampaignManagerProps) {
  const [startDate, setStartDate] = useState(() => toDatetimeLocalValue(settings.campaignStartDate));
  const [endDate, setEndDate] = useState(() => toDatetimeLocalValue(settings.campaignEndDate));
  const [savingDates, setSavingDates] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [draftSelected, setDraftSelected] = useState<Set<string>>(new Set());
  const [savingFeatured, setSavingFeatured] = useState(false);

  const status = getCampaignStatus(settings.campaignStartDate, settings.campaignEndDate);
  const statusInfo = statusLabels[status];

  useEffect(() => {
    setStartDate(toDatetimeLocalValue(settings.campaignStartDate));
    setEndDate(toDatetimeLocalValue(settings.campaignEndDate));
  }, [settings.campaignStartDate, settings.campaignEndDate]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  const filteredPickerProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const openPicker = () => {
    setDraftSelected(new Set(products.filter((p) => p.featured).map((p) => p._id)));
    setProductSearch('');
    setPickerOpen(true);
  };

  const closePicker = () => {
    if (savingFeatured) return;
    setPickerOpen(false);
  };

  const toggleDraft = (productId: string) => {
    setDraftSelected((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleSaveDates = async () => {
    const startIso = parseDatetimeLocal(startDate);
    const endIso = parseDatetimeLocal(endDate);

    if (startIso && endIso && new Date(startIso) >= new Date(endIso)) {
      alert('Bitiş tarihi başlangıçtan sonra olmalıdır.');
      return;
    }

    setSavingDates(true);
    try {
      await onSaveDates({
        campaignStartDate: startIso,
        campaignEndDate: endIso,
      });
    } finally {
      setSavingDates(false);
    }
  };

  const handleConfirmFeatured = async () => {
    setSavingFeatured(true);
    try {
      const ok = await onApplyFeatured(Array.from(draftSelected));
      if (ok) setPickerOpen(false);
    } finally {
      setSavingFeatured(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Kampanya Tarihleri</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
              {statusInfo.text}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Başlangıç</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-gray-400">Bitiş</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {(settings.campaignStartDate || settings.campaignEndDate) && (
            <p className="mt-3 text-xs text-gray-500">
              Kayıtlı: {formatCampaignDateTr(settings.campaignStartDate)} — {formatCampaignDateTr(settings.campaignEndDate)}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSaveDates}
              disabled={savingDates}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {savingDates ? 'Kaydediliyor...' : 'Tarihleri Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                onSaveDates({ campaignStartDate: null, campaignEndDate: null });
              }}
              className="rounded-lg border border-[#2a3142] px-4 py-2.5 text-sm text-gray-300 hover:text-white"
            >
              Tarihleri Temizle
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                <FiStar className="text-amber-400" size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Kampanyalı Ürünler</h3>
                <p className="text-xs text-amber-400">{featuredProducts.length} ürün seçili</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPicker}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#0f1117] transition hover:bg-amber-400"
            >
              <FiPlus size={16} />
              Kampanyalı Ürünleri Seç
            </button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {featuredProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5"
                >
                  <img
                    src={product.image || PRODUCT_PLACEHOLDER}
                    alt=""
                    className="h-8 w-8 rounded object-contain bg-[#0f1117]"
                  />
                  <span className="max-w-[160px] truncate text-xs text-white">{product.name}</span>
                  <span className="text-[10px] text-amber-300">
                    ₺{product.price.toLocaleString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Henüz kampanyalı ürün yok. &quot;Kampanyalı Ürünleri Seç&quot; ile listeden seçip onaylayın.
            </p>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closePicker}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-picker-title"
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#2a3142] bg-[#151922] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#2a3142] px-5 py-4">
              <div>
                <h3 id="campaign-picker-title" className="text-lg font-bold text-white">
                  Kampanyalı Ürünleri Seç
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Listeden işaretleyin, onayladıktan sonra fırsat ürünlerinde görünür.
                </p>
              </div>
              <button
                type="button"
                onClick={closePicker}
                disabled={savingFeatured}
                className="rounded-lg p-2 text-gray-400 hover:bg-[#1a1f2b] hover:text-white disabled:opacity-50"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="border-b border-[#2a3142] px-5 py-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-amber-400">{draftSelected.size} ürün seçildi</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredPickerProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">Ürün bulunamadı</p>
              ) : (
                filteredPickerProducts.map((product) => {
                  const selected = draftSelected.has(product._id);
                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => toggleDraft(product._id)}
                      className={`flex w-full items-center gap-3 border-b border-[#2a3142]/60 px-5 py-3 text-left transition-colors last:border-b-0 ${
                        selected ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-[#1a1f2b]'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? 'border-amber-400 bg-amber-400 text-[#0f1117]'
                            : 'border-gray-600 bg-transparent'
                        }`}
                      >
                        {selected && <FiCheck size={12} />}
                      </div>
                      <img
                        src={product.image || PRODUCT_PLACEHOLDER}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded bg-[#0f1117] object-contain p-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.category?.name || 'Kategori yok'} · Stok: {product.stock}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-amber-400">
                        ₺{product.price.toLocaleString('tr-TR')}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#2a3142] px-5 py-4">
              <button
                type="button"
                onClick={closePicker}
                disabled={savingFeatured}
                className="rounded-lg border border-[#2a3142] px-4 py-2.5 text-sm text-gray-300 hover:text-white disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmFeatured}
                disabled={savingFeatured}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0f1117] hover:bg-amber-400 disabled:opacity-60"
              >
                <FiCheck size={16} />
                {savingFeatured ? 'Kaydediliyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
