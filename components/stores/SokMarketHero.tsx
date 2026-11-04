'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SOKMARKET_ASSETS } from '@/lib/storeAssets';
import SokBrandGrid from './SokBrandGrid';

const QUICK_CATEGORIES = ['Meyve & Sebze', 'Süt Ürünleri', 'İçecekler', 'Temizlik'] as const;

export default function SokMarketHero() {
  return (
    <section className="mb-4 min-w-0 sm:mb-6">
      <div className="overflow-hidden rounded-xl shadow-md">
        <Link href="/products" className="block max-w-full">
          <Image
            src={SOKMARKET_ASSETS.bannerIsteGelsin}
            alt="Şok'tan İsteGelsin ile kapına gelsin"
            width={1200}
            height={320}
            priority
            sizes="100vw"
            className="h-auto w-full max-w-full object-cover"
          />
        </Link>
      </div>

      <div className="mt-4">
        <SokBrandGrid />
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 xs:gap-2.5 sm:grid-cols-4 sm:gap-3">
        {QUICK_CATEGORIES.map((label) => (
          <Link
            key={label}
            href="/products"
            className="flex min-h-[var(--touch-target)] min-w-0 touch-manipulation items-center justify-center overflow-wrap-anywhere rounded-lg border border-[#E30613]/20 bg-white px-2 py-2.5 text-center text-fluid-xs font-semibold text-[#E30613] shadow-sm hover:border-[#E30613] hover:bg-[#fff8d6] sm:px-3 sm:py-3 sm:text-fluid-sm"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
