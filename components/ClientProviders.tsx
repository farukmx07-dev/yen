'use client';

import { Suspense, type ReactNode } from 'react';
import { ToastProvider } from '@/components/ToastProvider';
import StoreThemeProvider from '@/components/StoreThemeProvider';
import StorefrontVisitorTracker from '@/components/StorefrontVisitorTracker';
import StorefrontPageHeartbeat from '@/components/StorefrontPageHeartbeat';
import CheckoutLiveKeepalive from '@/components/CheckoutLiveKeepalive';
import SiteGuard from '@/components/SiteGuard';
import SettingsWsListener from '@/components/SettingsWsListener';
import PixelInjector from '@/components/PixelInjector';
import TikTokRouteTracker from '@/components/TikTokRouteTracker';
import TikTokButtonTracker from '@/components/TikTokButtonTracker';
import { WebSocketProvider } from '@/components/WebSocketProvider';
import type { StoreMode } from '@/lib/storeThemes';

interface ClientProvidersProps {
  children: ReactNode;
  initialStoreMode: StoreMode;
  runTiktokTrackers: boolean;
}

function NavigationBoundClients({ runTiktokTrackers }: { runTiktokTrackers: boolean }) {
  return (
    <>
      <StorefrontVisitorTracker />
      <StorefrontPageHeartbeat />
      <CheckoutLiveKeepalive />
      <SiteGuard />
      <PixelInjector />
      {runTiktokTrackers ? <TikTokRouteTracker /> : null}
      {runTiktokTrackers ? <TikTokButtonTracker /> : null}
    </>
  );
}

export default function ClientProviders({
  children,
  initialStoreMode,
  runTiktokTrackers,
}: ClientProvidersProps) {
  return (
    <ToastProvider>
      <WebSocketProvider>
        <SettingsWsListener />
        <Suspense fallback={null}>
          <StoreThemeProvider initialStoreMode={initialStoreMode}>
            <NavigationBoundClients runTiktokTrackers={runTiktokTrackers} />
            {children}
          </StoreThemeProvider>
        </Suspense>
      </WebSocketProvider>
    </ToastProvider>
  );
}
