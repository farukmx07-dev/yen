import Link from 'next/link';
import Image from 'next/image';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';
import { CARREFOURSA_ASSETS } from '@/lib/storeAssets';
import CarrefourSALogo from '@/components/Logos/CarrefourSALogo';

const FOOTER_HREF = '/products';

const FOOTER_COLUMNS = [
  {
    title: 'Kategoriler',
    links: [
      'Meyve, Sebze',
      'Et, Balık, Tavuk',
      'Süt, Kahvaltılık',
      'Temel Gıda',
      'İçecekler',
      'Temizlik',
      'Kişisel Bakım',
      'Bebek',
    ],
  },
  {
    title: 'Kurumsal',
    links: ['Hakkımızda', 'Mağazalarımız', 'Kariyer', 'Yatırımcı İlişkileri', 'Basın Odası'],
  },
  {
    title: 'Yardım',
    links: [
      'Sipariş Takibi',
      'Sıkça Sorulan Sorular',
      'İade ve Değişim',
      'Teslimat Bilgileri',
      'Müşteri Hizmetleri',
    ],
  },
  {
    title: 'Sözleşmeler',
    links: [
      'Üyelik Sözleşmesi',
      'Mesafeli Satış Sözleşmesi',
      'Kişisel Verilerin Korunması',
      'Çerez Politikası',
    ],
  },
];

export default function CarrefourSAFooter() {
  return (
    <footer className="mt-12 w-full min-w-0 overflow-x-clip sm:mt-16">
      <div className="border-y border-[#003d7a] bg-[#eef3f8]">
        <div className="container mx-auto flex min-w-0 flex-wrap items-center justify-center gap-4 px-[var(--container-padding)] py-4 sm:justify-between sm:gap-6">
          <p className="min-w-0 text-center text-fluid-sm font-bold text-[#004E97] sm:text-left">
            Müşteri Hizmetleri:{' '}
            <a href="tel:4441000" className="text-fluid-lg touch-manipulation hover:underline">
              444 1 000
            </a>
          </p>
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-fluid-xs text-gray-600">
            <span className="shrink-0">Tıkla Gel Al</span>
            <span className="hidden xs:inline" aria-hidden>•</span>
            <span className="shrink-0">Kapıda Teslimat</span>
            <span className="hidden xs:inline" aria-hidden>•</span>
            <span className="shrink-0">Ücretsiz Teslimat</span>
          </div>
        </div>
      </div>

      <div className="bg-[#003d7a] text-white">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-8 sm:py-10">
          <div className="mb-8 flex min-w-0 flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <CarrefourSALogo inverted className="max-w-full" />
            <div className="flex flex-wrap items-center gap-3">
              {[
                { Icon: FiFacebook, label: 'Facebook' },
                { Icon: FiInstagram, label: 'Instagram' },
                { Icon: FiTwitter, label: 'Twitter' },
                { Icon: FiYoutube, label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <Link
                  key={label}
                  href={FOOTER_HREF}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 touch-manipulation hover:bg-white/20 min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xxs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <h4 className="mb-3 text-fluid-sm font-bold">{col.title}</h4>
                <ul className="space-y-1.5 text-fluid-xs text-white/80">
                  {col.links.map((link) => (
                    <li key={link} className="min-w-0">
                      <Link
                        href={FOOTER_HREF}
                        className="block overflow-wrap-anywhere touch-manipulation hover:text-white hover:underline"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex min-w-0 flex-col items-center justify-between gap-6 border-t border-white/20 pt-6 sm:flex-row sm:items-center">
            <p className="min-w-0 text-center text-fluid-xs text-white/70 sm:text-left">
              © 2026 CarrefourSA — Tüm Hakları Saklıdır.
            </p>
            <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-4">
              <div className="max-w-full shrink rounded-lg bg-white px-3 py-2">
                <Image
                  src={CARREFOURSA_ASSETS.paymentLogos}
                  alt="Visa, Mastercard, American Express, Juzdan, Troy"
                  width={320}
                  height={40}
                  className="h-[clamp(1.5rem,4vw,2rem)] w-auto max-w-[min(100%,16.25rem)] object-contain"
                />
              </div>
              <Image
                src={CARREFOURSA_ASSETS.eyebrand}
                alt="Görme Engelliler için eyebrand 2023-2024"
                width={160}
                height={48}
                className="h-[clamp(2rem,5vw,2.75rem)] w-auto max-w-[min(100%,10rem)] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
