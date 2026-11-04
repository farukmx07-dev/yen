'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { STOREFRONT_SETTINGS_POLL_MS } from '@/lib/constants';
import { isMobileOrTabletClient } from '@/lib/deviceUtils';
import {
  hasStorefrontAccessClient,
  resolveInactiveRedirectUrl,
} from '@/lib/inactiveRedirect';
import type { PublicSettingsSnapshot } from '@/lib/publicSettings';
import { onSettingsUpdate } from '@/lib/settingsRuntime';

function shouldBlockVisitor(settings: PublicSettingsSnapshot): boolean {
  const isDesktopOnMobileOnly = settings.mobileOnly && !isMobileOrTabletClient();
  return Boolean(
    settings.isIpBanned || settings.siteActive === false || isDesktopOnMobileOnly
  );
}

function applyAccessCheck(settings: PublicSettingsSnapshot) {
  if (settings.siteActive === false) {
    window.location.replace(resolveInactiveRedirectUrl(settings.inactiveRedirectUrl));
    return;
  }

  if (shouldBlockVisitor(settings) && !hasStorefrontAccessClient()) {
    window.location.replace(resolveInactiveRedirectUrl(settings.inactiveRedirectUrl));
  }
}

export default function SiteGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    let active = true;

    const applySettings = (settings: PublicSettingsSnapshot) => {
      if (!active) return;
      applyAccessCheck(settings);
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await res.json();
        if (!active || !data.success) return;
        applySettings(data.data);
      } catch {
        /* sessizce devam */
      }
    };

    void fetchSettings();
    const interval = setInterval(fetchSettings, STOREFRONT_SETTINGS_POLL_MS);
    const unsubscribe = onSettingsUpdate((settings) => {
      applySettings(settings);
    });

    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [pathname]);

  return null;
}
