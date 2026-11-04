'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { clearVisitorTracking, logVisitor } from '@/lib/visitorLogger';
import { resolveStorefrontPageType } from '@/lib/storefrontPageTypes';

function readSearchString(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search.replace(/^\?/, '');
}

function trackCurrentRoute(pathname: string | null, search: string) {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');

  if (!path || path.startsWith('/admin') || path.startsWith('/checkout')) {
    clearVisitorTracking();
    return;
  }

  const data = resolveStorefrontPageType(path, search);
  if (!data) return;

  void logVisitor(data);
}

function StorefrontVisitorTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    trackCurrentRoute(pathname, search);
  }, [pathname, search]);

  return null;
}

export default function StorefrontVisitorTracker() {
  return (
    <Suspense fallback={null}>
      <StorefrontVisitorTrackerInner />
    </Suspense>
  );
}

export function trackStorefrontRoute(pathname?: string | null) {
  trackCurrentRoute(pathname ?? null, readSearchString());
}
