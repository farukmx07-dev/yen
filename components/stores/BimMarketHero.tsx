'use client';

import Link from 'next/link';

const QUICK_CATEGORIES = ['Aktüel Ürünler', 'İndirim', 'Temel Gıda', 'Temizlik'] as const;

export default function BimMarketHero() {
  return (
    <section className="mb-4 min-w-0 sm:mb-6">
      <div className="overflow-hidden rounded-xl border-2 border-[#ED1C24] bg-white p-4 shadow-sm sm:p-5">
        <p className="text-fluid-xs font-bold uppercase tracking-wide text-[#ED1C24]">Aktüel Ürünler</p>
        <h2 className="mt-1 text-fluid-xl font-black text-gray-900 sm:text-fluid-2xl">BİM Aktüel Fırsatları</h2>
        <p className="mt-1 text-fluid-xs text-gray-600 sm:text-fluid-sm">
          Her hafta yeni ürünler, uygun fiyatlarla.
        </p>
        <Link
          href="/products?firsat=1"
          className="mt-4 inline-flex min-h-[var(--touch-target)] items-center rounded-lg bg-[#ED1C24] px-4 py-2.5 text-fluid-sm font-bold text-white touch-manipulation hover:bg-[#C4000F]"
        >
          Tüm Aktüel Ürünler →
        </Link>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {QUICK_CATEGORIES.map((label) => (
          <Link
            key={label}
            href="/products"
            className="flex min-h-[var(--touch-target)] items-center justify-center rounded-lg border-2 border-[#ED1C24]/30 bg-white px-2 py-2.5 text-center text-fluid-xs font-semibold text-[#ED1C24] shadow-sm hover:border-[#ED1C24] hover:bg-red-50 sm:py-3 sm:text-fluid-sm"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
