'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CARREFOURSA_ASSETS } from '@/lib/storeAssets';

const QUICK_CATEGORIES = ['Meyve & Sebze', 'Et & Balık', 'Temizlik', 'İçecek'] as const;

export default function CarrefourSAHero() {
  return (
    <section className="mb-4 min-w-0 sm:mb-6">
      <div className="mb-4 flex justify-center md:hidden">
        <Image
          src={CARREFOURSA_ASSETS.logoMobile}
          alt="CarrefourSA Online Market"
          width={280}
          height={120}
          priority
          sizes="(max-width: 768px) 85vw, 280px"
          className="h-auto w-full max-w-[min(100%,17.5rem)] object-contain"
        />
      </div>

      <div className="overflow-hidden rounded-xl shadow-md">
        <Link href="/products" className="block max-w-full">
          <Image
            src={CARREFOURSA_ASSETS.bannerFreeDelivery}
            alt="1-30 Haziran Ücretsiz Teslimat"
            width={1200}
            height={120}
            sizes="100vw"
            className="h-auto w-full max-w-full object-cover"
          />
        </Link>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 xs:gap-2.5 sm:grid-cols-4 sm:gap-3">
        {QUICK_CATEGORIES.map((label) => (
          <Link
            key={label}
            href="/products"
            className="min-w-0 touch-manipulation rounded-lg border border-[#004E97]/20 bg-white px-2 py-2.5 text-center text-fluid-xs font-semibold text-[#004E97] shadow-sm hover:border-[#004E97] hover:bg-[#eef3f8] sm:px-3 sm:py-3 sm:text-fluid-sm min-h-[var(--touch-target)] flex items-center justify-center overflow-wrap-anywhere"
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
