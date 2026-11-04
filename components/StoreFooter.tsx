'use client';

import { useStoreTheme } from '@/components/StoreThemeProvider';
import Footer from '@/components/Footer';
import CarrefourSAFooter from '@/components/stores/CarrefourSAFooter';
import SokMarketFooter from '@/components/stores/SokMarketFooter';
import BimMarketFooter from '@/components/stores/BimMarketFooter';

export default function StoreFooter() {
  const { storeMode } = useStoreTheme();

  if (storeMode === 'carrefoursa') {
    return <CarrefourSAFooter />;
  }

  if (storeMode === 'sokmarket') {
    return <SokMarketFooter />;
  }

  if (storeMode === 'bim') {
    return <BimMarketFooter />;
  }

  return <Footer />;
}
