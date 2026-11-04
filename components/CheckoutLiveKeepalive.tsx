'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { postLogHeartbeat } from '@/lib/liveFormLogger';
import { getVisitorLogId } from '@/lib/visitorSession';
import { resolveStorefrontPageType } from '@/lib/storefrontPageTypes';
import { VISITOR_HEARTBEAT_MS } from '@/lib/constants';
import { safeJsonParse } from '@/lib/safeStorage';

function readCartTotal(): number {
  if (typeof window === 'undefined') return 0;
  const cart = safeJsonParse<Array<{ price: number; quantity: number }>>(
    localStorage.getItem('cart'),
    []
  );
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
}

export default function CheckoutLiveKeepalive() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith('/checkout')) return;

    const page = resolveStorefrontPageType(pathname);
    if (!page || page.pageType === 'admin') return;

    if (page.pageType === 'address' && !getVisitorLogId()) return;

    const ping = () => {
      const logId = getVisitorLogId();
      if (page.pageType === 'address' && !logId) return;

      void postLogHeartbeat({
        logId: logId || undefined,
        pageType: page.pageType,
        amount: readCartTotal(),
      });
    };

    ping();
    const interval = setInterval(ping, VISITOR_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
