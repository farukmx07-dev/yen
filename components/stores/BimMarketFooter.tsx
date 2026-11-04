'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';
import { BIM_ASSETS } from '@/lib/storeAssets';
import BimLogo from '@/components/Logos/BimLogo';
import SokPaymentLogos from './SokPaymentLogos';

const FOOTER_HREF = '/products';

const FOOTER_COLUMNS = [
  { title: 'Anasayfa', links: ['Ürünler', 'Aktüel Ürünler', 'İndirim', 'Kampanyalar'] },
  { title: 'BİM\'e Özel', links: ['BİM Markaları', 'Afişler', 'Tarifler'] },
  { title: 'Yardım', links: ['Sıkça Sorulan Sorular', 'İade Koşulları', 'İletişim'] },
  { title: 'Mağazalar', links: ['Mağaza Bul', 'Franchise', 'Kariyer'] },
];

export default function BimMarketFooter() {
  return (
    <footer className="mt-12 w-full min-w-0 overflow-x-clip sm:mt-16">
      <div className="border-y border-red-200 bg-red-50">
        <div className="container mx-auto px-[var(--container-padding)] py-4 text-center sm:text-left">
          <p className="text-fluid-sm font-bold text-[#ED1C24]">
            Müşteri Hizmetleri:{' '}
            <a href="tel:4444246" className="hover:underline">
              444 4 246
            </a>
          </p>
        </div>
      </div>

      <div className="bg-white text-gray-900">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-8 sm:py-10">
          <div className="mb-8 flex min-w-0 flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <BimLogo />
            <Image
              src={BIM_ASSETS.guvence}
              alt="Kalitemiz güvence altındadır"
              width={120}
              height={120}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
            />
            <div className="flex flex-col gap-2">
              <Image src={BRAND_ASSETS.appStores.googlePlay} alt="Google Play" width={120} height={36} className="h-9 w-auto object-contain" />
              <Image src={BRAND_ASSETS.appStores.appStore} alt="App Store" width={120} height={36} className="h-9 w-auto object-contain" />
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <h4 className="mb-3 text-fluid-sm font-bold text-[#ED1C24]">{col.title}</h4>
                <ul className="space-y-1.5 text-fluid-xs text-gray-700">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href={FOOTER_HREF} className="touch-manipulation hover:text-[#ED1C24] hover:underline">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] text-white">
        <div className="container mx-auto flex min-w-0 flex-col items-center justify-between gap-4 px-[var(--container-padding)] py-4 sm:flex-row">
          <p className="text-fluid-xs text-white/70">© 2026 BİM — Tüm Hakları Saklıdır.</p>
          <SokPaymentLogos />
        </div>
      </div>
    </footer>
  );
}
