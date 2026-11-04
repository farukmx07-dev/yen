'use client';

import Link from 'next/link';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import A101Logo from './Logos/A101Logo';
import A101EkstraLogo from './Logos/A101EkstraLogo';
import A101KapidaLogo from './Logos/A101KapidaLogo';

function SingleBrandBar() {
  const { theme } = useStoreTheme();

  return (
    <div className="container mx-auto px-2 sm:px-4 max-w-full">
      <Link
        href="/products"
        className="flex min-h-[48px] sm:min-h-[52px] items-center justify-between gap-3 py-2"
        style={{ color: theme.headerText }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {theme.id === 'carrefoursa' && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              C
            </span>
          )}
          {theme.id === 'bim' && (
            <span className="rounded bg-white px-2 py-0.5 text-xl font-black tracking-tight text-[#ED1C24]">
              BİM
            </span>
          )}
          {theme.id === 'sokmarket' && (
            <span
              className="rounded px-2 py-0.5 text-xl font-black tracking-tight"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              ŞOK
            </span>
          )}
          <div className="min-w-0">
            {theme.id !== 'bim' && theme.id !== 'sokmarket' && (
              <p className="truncate text-lg font-black leading-none sm:text-xl">{theme.label}</p>
            )}
            {theme.tagline && (
              <p
                className="truncate text-[10px] font-semibold opacity-90 sm:text-xs"
                style={{ color: theme.headerText }}
              >
                {theme.tagline}
              </p>
            )}
          </div>
        </div>
        <span className="hidden text-xs font-semibold opacity-90 sm:inline">Online Alışveriş</span>
      </Link>
    </div>
  );
}

export default function StoreBrandBar() {
  const { theme } = useStoreTheme();

  if (theme.headerStyle === 'a101-triple') {
    return (
      <div className="bg-a101-teal">
        <div className="container mx-auto px-1.5 sm:px-2 md:px-3 lg:px-4 max-w-full">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 py-2.5 sm:py-3 md:py-3.5 min-w-0">
            <Link
              href="/products"
              className="bg-white hover:bg-gray-50 active:bg-gray-100 text-a101-teal px-1.5 sm:px-2 md:px-3 lg:px-3.5 py-2 sm:py-2.5 md:py-3 font-black rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:shadow-sm touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] flex items-center justify-center min-w-0 overflow-hidden"
            >
              <A101Logo className="w-12 sm:w-14 md:w-16 lg:w-[4.5rem] h-3.5 sm:h-4 md:h-5 lg:h-6 flex-shrink-0" />
            </Link>
            <Link
              href="/products"
              className="bg-white hover:bg-gray-50 active:bg-gray-100 text-a101-teal px-1.5 sm:px-2 md:px-3 lg:px-3.5 py-2 sm:py-2.5 md:py-3 font-black rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:shadow-sm touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] flex items-center justify-center min-w-0 overflow-hidden"
            >
              <A101EkstraLogo className="w-14 sm:w-16 md:w-[4.5rem] lg:w-24 h-3.5 sm:h-4 md:h-5 lg:h-6 hidden sm:block flex-shrink-0" />
              <span className="sm:hidden text-a101-teal font-black text-[11px] shrink-0">EKSTRA</span>
            </Link>
            <Link
              href="/products"
              className="bg-white hover:bg-gray-50 active:bg-gray-100 text-a101-teal px-1.5 sm:px-2 md:px-3 lg:px-3.5 py-2 sm:py-2.5 md:py-3 font-black rounded-lg transition-all duration-300 shadow-sm hover:shadow-md active:shadow-sm touch-manipulation min-h-[40px] sm:min-h-[44px] md:min-h-[48px] flex items-center justify-center min-w-0 overflow-hidden"
            >
              <A101KapidaLogo className="w-14 sm:w-16 md:w-[4.5rem] lg:w-24 h-3.5 sm:h-4 md:h-5 lg:h-6 hidden sm:block flex-shrink-0" />
              <span className="sm:hidden text-a101-teal font-black text-[11px] shrink-0">KAPIDA</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.headerBg }}>
      <SingleBrandBar />
    </div>
  );
}
