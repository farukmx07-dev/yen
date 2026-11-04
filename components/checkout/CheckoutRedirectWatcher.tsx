'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCheckoutAdminRedirect } from '@/lib/hooks/useCheckoutAdminRedirect';
import { getVisitorLogId } from '@/lib/visitorSession';

export default function CheckoutRedirectWatcher() {
  const searchParams = useSearchParams();
  const [logId, setLogId] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get('logId');
    const fromSession = getVisitorLogId();
    setLogId(fromUrl || fromSession || null);
  }, [searchParams]);

  useCheckoutAdminRedirect(logId, Boolean(logId));

  return null;
}
