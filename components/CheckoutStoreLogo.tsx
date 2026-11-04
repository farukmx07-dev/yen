'use client';

import Image from 'next/image';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import A101Logo from '@/components/Logos/A101Logo';
import CarrefourSALogo from '@/components/Logos/CarrefourSALogo';
import BimLogo from '@/components/Logos/BimLogo';
import SokMarketLogo from '@/components/Logos/SokMarketLogo';
import { CARREFOURSA_ASSETS } from '@/lib/storeAssets';

interface CheckoutStoreLogoProps {
  className?: string;
}

export default function CheckoutStoreLogo({ className = 'h-5 w-24 sm:h-6 sm:w-28' }: CheckoutStoreLogoProps) {
  const { storeMode } = useStoreTheme();

  if (storeMode === 'carrefoursa') {
    return (
      <Image
        src={CARREFOURSA_ASSETS.logo}
        alt="CarrefourSA"
        width={160}
        height={36}
        className={`object-contain object-center ${className}`}
      />
    );
  }

  if (storeMode === 'bim') {
    return <BimLogo className={className} />;
  }

  if (storeMode === 'sokmarket') {
    return <SokMarketLogo className={className} />;
  }

  return <A101Logo className={`flex-shrink-0 ${className}`} />;
}
