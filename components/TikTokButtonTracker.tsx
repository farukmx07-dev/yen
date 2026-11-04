'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { findInteractiveClickTarget, trackTikTokButtonClick } from '@/lib/tiktokPixel';

export default function TikTokButtonTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const el = findInteractiveClickTarget(event.target);
      if (!el) {
        return;
      }

      trackTikTokButtonClick(el);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  return null;
}
