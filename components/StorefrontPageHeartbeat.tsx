'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackStorefrontRoute } from '@/components/StorefrontVisitorTracker';
import { clearVisitorTracking } from '@/lib/visitorLogger';
import { setupInactiveListener } from '@/lib/setLogInactive';

export default function StorefrontPageHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    if (pathname.startsWith('/checkout')) {
      clearVisitorTracking();
      return;
    }

    setupInactiveListener();
    trackStorefrontRoute(pathname);
  }, [pathname]);

  return null;
}
