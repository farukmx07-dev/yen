'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import StoreFooter from '@/components/StoreFooter';
import { getCartAnalytics, trackTikTokOnce } from '@/lib/tiktokPixel';
import { CHECKOUT_REDIRECT_POLL_MS } from '@/lib/constants';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const logId = searchParams.get('logId');
  const [orderNumber, setOrderNumber] = useState('');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Admin panelinden yönlendirme kontrolü (zincirleme yönlendirme için)
  const checkAdminRedirect = useCallback(async () => {
    if (!logId) return false;

    try {
      const res = await fetch(`/api/logs/${logId}/status?t=${Date.now()}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const log = data.data;
        
        // Eğer admin panelinden yönlendirme yapıldıysa
        if (log.redirectTo && log.redirectTo.trim() !== '') {
          const currentUrl = window.location.href;
          
          // URL'i düzelt ve logId ekle (yoksa)
          let redirectUrl = log.redirectTo.trim();
          if (!redirectUrl.includes('logId=') && logId) {
            redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + `logId=${logId}`;
          }
          
          if (redirectUrl.startsWith('/')) {
            redirectUrl = window.location.origin + redirectUrl;
          } else if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
            redirectUrl = window.location.origin + '/' + redirectUrl;
          }
          
          // Mevcut URL ile yönlendirme URL'ini karşılaştır
          // Eğer tamamen aynıysa yönlendirme yapma (sonsuz döngüyü önle)
          const currentUrlNormalized = currentUrl.split('#')[0].replace(/\/$/, '');
          const redirectUrlNormalized = redirectUrl.split('#')[0].replace(/\/$/, '');
          
          // Eğer URL'ler farklıysa veya aynı path ama farklı query parametreleri varsa yönlendir
          if (currentUrlNormalized !== redirectUrlNormalized) {
            // Debug logları kaldırıldı (performans için)
            
            // Interval'i durdur
            if (checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current);
              checkIntervalRef.current = null;
            }
            
            // Yönlendir (hemen, gecikme olmadan)
            window.location.href = redirectUrl;
            
            return true;
          } else {
            // Aynı URL'e yönlendirme yapılmaya çalışılıyor, bu normal (sonsuz döngü yok)
            console.log('ℹ️ Aynı URL\'e yönlendirme yapılmaya çalışılıyor, atlanıyor:', redirectUrlNormalized);
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Admin yönlendirme kontrolü hatası:', error);
      return false;
    }
  }, [logId]);

  useEffect(() => {
    const newOrderNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    setOrderNumber(newOrderNumber);

    const ctxRaw = sessionStorage.getItem('checkoutPaymentContext');
    let paymentValue = getCartAnalytics().value;
    if (ctxRaw) {
      try {
        const ctx = JSON.parse(ctxRaw);
        if (ctx.amount) paymentValue = ctx.amount;
      } catch {
        /* ignore */
      }
    }

    trackTikTokOnce(
      'CompletePayment',
      {
        value: paymentValue,
        currency: 'TRY',
      },
      'ttq_complete_payment'
    );

    if (logId) {
      // İlk kontrol (hemen)
      checkAdminRedirect();
      
      // Her 300ms'de bir kontrol et (daha sık - anlık yönlendirme için)
      checkIntervalRef.current = setInterval(() => {
        checkAdminRedirect();
      }, CHECKOUT_REDIRECT_POLL_MS);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [logId, checkAdminRedirect]);

  return (
    <div className="min-h-screen bg-a101-grayLight flex flex-col w-full min-w-0 overflow-x-clip">
      <Header />

      <main className="flex-1 flex items-center justify-center px-2 sm:px-3 md:px-4 py-6 sm:py-8 md:py-12">
        <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="mb-4 sm:mb-5 md:mb-6 flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-a101-teal rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-a101-teal mb-4 sm:mb-5 md:mb-6 leading-tight">
            Siparişiniz Başarıyla Oluşturuldu!
          </h1>

          {/* Order Number */}
          <div className="bg-a101-teal/10 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
            <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2 leading-[1.3]">Sipariş Numaranız</p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-a101-teal leading-[1.2] break-all">
              {orderNumber}
            </p>
          </div>

          {/* Confirmation Message */}
          <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 leading-[1.4]">
            Siparişiniz başarıyla sistemimize kaydedilmiştir.
          </p>

          {/* Delivery Information */}
          <div className="bg-a101-teal/10 rounded-lg p-4 sm:p-5 md:p-6 mb-6 sm:mb-7 md:mb-8">
            <p className="text-xs sm:text-sm text-gray-700 leading-[1.5]">
              Siparişiniz, yoğunluğa bağlı olarak <span className="font-black text-a101-teal">1-3 iş günü</span> içerisinde adresinize teslim edilecektir.
            </p>
          </div>

          {/* Action Button */}
          <Link
            href="/products"
            className="block w-full bg-a101-teal hover:bg-a101-tealLight text-white py-3 sm:py-3.5 md:py-4 rounded-lg font-black text-xs sm:text-sm md:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 uppercase touch-manipulation min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
          >
            ALIŞVERİŞE DEVAM ET
          </Link>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}

