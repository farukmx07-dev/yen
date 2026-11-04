'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackTikTokPageView } from '@/lib/tiktokPixel';

export default function TikTokRouteTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackTikTokPageView();
  }, [pathname]);

  return null;
}
