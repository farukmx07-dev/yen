import Link from 'next/link';
import Image from 'next/image';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';
import { BRAND_ASSETS } from '@/lib/publicAssets';
import SokMarketLogo from '@/components/Logos/SokMarketLogo';
import SokPaymentLogos from './SokPaymentLogos';

const FOOTER_HREF = '/products';

const FOOTER_COLUMNS = [
  {
    title: 'Kategoriler',
    links: [
      'Meyve, Sebze',
      'Et, Tavuk, Balık',
      'Süt, Kahvaltılık',
      'Temel Gıda',
      'İçecekler',
      'Temizlik',
      'Kişisel Bakım',
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

export default function SokMarketFooter() {
  return (
    <footer className="mt-12 w-full min-w-0 overflow-x-clip sm:mt-16">
      <div className="border-y border-[#e6bc00] bg-[#fff8d6]">
        <div className="container mx-auto flex min-w-0 flex-wrap items-center justify-center gap-4 px-[var(--container-padding)] py-4 sm:justify-between sm:gap-6">
          <p className="min-w-0 text-center text-fluid-sm font-bold text-[#E30613] sm:text-left">
            Müşteri Hizmetleri:{' '}
            <a href="tel:4444588" className="text-fluid-lg touch-manipulation hover:underline">
              444 4 588
            </a>
          </p>
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-fluid-xs text-gray-700">
            <span className="shrink-0">Kapıda Teslimat</span>
            <span className="hidden xs:inline" aria-hidden>•</span>
            <span className="shrink-0">Hızlı Teslimat</span>
            <span className="hidden xs:inline" aria-hidden>•</span>
            <span className="shrink-0">Güvenli Ödeme</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FFD100] text-gray-900">
        <div className="container mx-auto min-w-0 px-[var(--container-padding)] py-8 sm:py-10">
          <div className="mb-8 flex min-w-0 flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <SokMarketLogo />
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-800 touch-manipulation hover:bg-white min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Image
                src={BRAND_ASSETS.appStores.googlePlay}
                alt="Google Play"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
              <Image
                src={BRAND_ASSETS.appStores.appStore}
                alt="App Store"
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xxs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <h4 className="mb-3 text-fluid-sm font-bold text-gray-900">{col.title}</h4>
                <ul className="space-y-1.5 text-fluid-xs text-gray-800">
                  {col.links.map((link) => (
                    <li key={link} className="min-w-0">
                      <Link
                        href={FOOTER_HREF}
                        className="block overflow-wrap-anywhere touch-manipulation hover:text-[#E30613] hover:underline"
                      >
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
        <div className="container mx-auto flex min-w-0 flex-col items-center justify-between gap-4 px-[var(--container-padding)] py-4 sm:flex-row sm:gap-6">
          <p className="min-w-0 text-center text-fluid-xs text-white/70 sm:text-left">
            © 2026 Şok Market — Tüm Hakları Saklıdır.
          </p>
          <SokPaymentLogos />
        </div>
      </div>
    </footer>
  );
}
