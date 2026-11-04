'use client';

import Link from 'next/link';
import { FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import AppStoreButton from './Logos/AppStoreButton';
import GooglePlayButton from './Logos/GooglePlayButton';
import QRCode from './Logos/QRCode';
import ETBISBadge from './Logos/ETBISBadge';
import TRGOBadge from './Logos/TRGOBadge';
import { useStoreTheme } from '@/components/StoreThemeProvider';

const FOOTER_HREF = '/products';

export default function Footer() {
  const { copy } = useStoreTheme();

  return (
    <footer className="bg-white mt-12 sm:mt-16 border-t border-gray-200 w-full min-w-0 overflow-x-clip">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12 max-w-full">
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 min-w-0">
          {/* Column 1: Site Haritası */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-2 sm:mb-3 md:mb-4 text-[10px] sm:text-xs md:text-sm leading-tight">Site Haritası</h4>
            <ul className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-600 leading-[1.4]">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors touch-manipulation block py-0.5">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kampanyalar
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Bilgi Toplumu Hizmetleri
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kişisel Verilerin Korunması
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Özel Sayfalar */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">Özel Sayfalar</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  {copy.footerFeaturedTitle}
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Haftanın Yıldızları
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Çok Al Az Öde
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ucuzun da Ucuzu Fiyatlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Aldın Aldın */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">{copy.footerFeaturedTitle}</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Elektronik
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ev & Yaşam
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Anne & Bebek & Oyuncak
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kozmetik & Kişisel Bakım
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Oto Bahçe & Yapı
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Giyim & Aksesuar
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kitap & Kırtasiye
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: En Çok Satanlar */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">En Çok Satanlar</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Televizyon
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Bebek Bezi
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Bilgisayar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Popüler Kategoriler */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">Popüler Kategoriler</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Beyaz Eşya
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Anne & Bebek & Oyuncak
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kozmetik & Kişisel Bakım
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ev & Yaşam
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Giyim & Aksesuar
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 6: Popüler Markalar */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">Popüler Markalar</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Apple
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Adidas
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Arzum
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Birkenstock
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Braun
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Calvin Klein
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Casio
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Crocs
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Columbia
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Lenovo
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 7: Yardım */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">Yardım</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Sipariş Takip
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Popüler Sorular
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  İptal - İade
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kargo & Teslimat
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Sipariş
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Üyelik
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ödeme
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Fatura
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ürün Özellikleri
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Hediye Çeki & Kampanya
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 8: Sözleşmeler */}
          <div className="min-w-0">
            <h4 className="font-black text-a101-teal mb-3 sm:mb-4 text-xs sm:text-sm">Sözleşmeler</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Üyelik Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Ön Bilgilendirme Formu
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Açık Rıza Metni
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Kişisel Verilerin Korunması
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  İş Sağlığı ve Güvenliği Politikası
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  Çevre Politikası
                </Link>
              </li>
              <li>
                <Link href={FOOTER_HREF} className="hover:text-a101-teal transition-colors">
                  İptal-İade Koşulları
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-4 sm:py-5 md:py-6 lg:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Social Media */}
            <div className="min-w-0">
              <h4 className="font-black text-a101-teal mb-2 sm:mb-3 text-[10px] sm:text-xs md:text-sm leading-tight">Sosyal Medya</h4>
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="Facebook"
                >
                  <FiFacebook className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                </Link>
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="Instagram"
                >
                  <FiInstagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                </Link>
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="Twitter"
                >
                  <FiTwitter className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                </Link>
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="TikTok"
                >
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold leading-[1]">T</span>
                </Link>
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="YouTube"
                >
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold leading-[1]">▶</span>
                </Link>
                <Link
                  href={FOOTER_HREF}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-a101-teal hover:text-white transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md touch-manipulation"
                  aria-label="LinkedIn"
                >
                  <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold leading-[1]">in</span>
                </Link>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-[1.3]">{copy.copyright}</p>
            </div>

            {/* App Downloads & QR Codes */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-2 sm:gap-3 md:gap-4">
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <AppStoreButton className="w-16 sm:w-20 md:w-24 h-6 sm:h-7 md:h-8" />
                <GooglePlayButton className="w-16 sm:w-20 md:w-24 h-6 sm:h-7 md:h-8" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <QRCode className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
                <ETBISBadge className="w-10 h-16 sm:w-12 sm:h-20 md:w-14 md:h-22 lg:w-16 lg:h-24" />
                <TRGOBadge className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
