'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type') || 'general';
    const logId = searchParams.get('logId');
    const params = new URLSearchParams();
    if (logId) params.set('logId', logId);
    params.set('error', type);
    router.replace(`/checkout/payment?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef1f4] text-sm text-gray-500">
      Yönlendiriliyor...
    </div>
  );
}
