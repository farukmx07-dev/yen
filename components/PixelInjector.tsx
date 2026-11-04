'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { injectPixelIntoDocument } from '@/lib/pixelParser';
import { STOREFRONT_SETTINGS_POLL_MS } from '@/lib/constants';

export default function PixelInjector() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    let mounted = true;
    let lastCode = '';

    const loadPixel = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!mounted || !data.success) return;

        const code = data.data?.pixelCode?.trim() || '';
        if (code === lastCode) return;

        if (!lastCode && document.querySelector('[data-site-pixel-script]')) {
          lastCode = code;
          return;
        }

        lastCode = code;
        if (!code) {
          document.querySelectorAll('[data-site-pixel-script]').forEach((el) => el.remove());
          document.getElementById('site-pixel-root')?.remove();
          return;
        }

        injectPixelIntoDocument(code);
      } catch {
        // sessizce devam
      }
    };

    loadPixel();
    const interval = setInterval(loadPixel, STOREFRONT_SETTINGS_POLL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
