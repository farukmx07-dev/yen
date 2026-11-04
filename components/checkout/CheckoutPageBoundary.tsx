'use client';

import { Suspense, type ReactNode } from 'react';

function CheckoutFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-gray-50">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-500"
        aria-label="Yükleniyor"
      />
    </div>
  );
}

export default function CheckoutPageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<CheckoutFallback />}>{children}</Suspense>;
}
