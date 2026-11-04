'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import ProductImage from '@/components/ProductImage';

export interface CampaignProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  featured?: boolean;
  category?: { name?: string };
}

interface CampaignProductsModalProps {
  products: CampaignProduct[];
  loading?: boolean;
  onClose: () => void;
}

function formatPrice(value: number) {
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function brandLabel(product: CampaignProduct) {
  const cat = product.category?.name?.trim();
  if (cat) return cat.toUpperCase();
  const first = product.name.split(' ')[0];
  return first.length > 2 ? first.toUpperCase() : 'KAMPANYA';
}

export default function CampaignProductsModal({
  products,
  loading,
  onClose,
}: CampaignProductsModalProps) {
  const { copy } = useStoreTheme();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-white/50 backdrop-blur-[3px] p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-cyan-400/40 bg-[#141820] shadow-[0_0_40px_rgba(34,211,238,0.15)] sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <h2
            id="campaign-modal-title"
            className="flex items-center gap-2 text-base font-black text-white"
          >
            <span className="text-amber-400">★</span>
            {copy.campaignModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#0a1628] shadow-lg shadow-cyan-400/30 transition hover:bg-cyan-300 active:scale-95"
          >
            X Kapat
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto overscroll-contain px-4 py-4 sm:max-h-[calc(85vh-64px)]">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Kampanyalı ürün bulunmuyor.</p>
          ) : (
            <ul className="space-y-4">
              {products.map((product) => (
                <li
                  key={product._id}
                  className="rounded-xl border border-white/10 bg-[#1c2129] p-3"
                >
                  <div className="flex gap-3">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-300">
                        {brandLabel(product)}
                      </span>
                      <p className="mt-1.5 line-clamp-3 text-sm font-semibold leading-snug text-white">
                        {product.name}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-cyan-400/15 px-3 py-1.5 text-sm font-black text-cyan-300">
                          {formatPrice(product.price)} ₺
                        </span>
                        <Link
                          href={`/products/${product._id}`}
                          onClick={onClose}
                          className="rounded-lg bg-cyan-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[#0a1628] shadow-md shadow-cyan-400/25 transition hover:bg-cyan-300 active:scale-95"
                        >
                          Ürüne Git
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
