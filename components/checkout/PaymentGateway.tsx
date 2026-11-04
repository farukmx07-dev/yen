'use client';

import { useState, useMemo, useEffect } from 'react';
import { FiChevronDown, FiHelpCircle, FiInfo } from 'react-icons/fi';
import PaymentTrustBadges from '@/components/checkout/PaymentTrustBadges';
import { getPaymentError } from '@/lib/paymentErrors';
import { detectBankBrand, detectCardFundingType } from '@/lib/cardUtils';
import CardSchemeBadge from '@/components/CardSchemeBadge';
import { BankLogoFromBrand } from '@/components/banks/logos/BankLogo';
import { buildInstallmentOptions, formatInstallmentPrice } from '@/lib/installmentOptions';

export interface PaymentFormData {
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  rememberCard: boolean;
}

interface PaymentGatewayProps {
  amount: number;
  errorType?: string | null;
  loading?: boolean;
  initialData?: Partial<PaymentFormData>;
  onPay: (data: PaymentFormData) => void;
  onFormChange?: (data: PaymentFormData) => void;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const THREE_D_BANK_LOGO_HEIGHT: Partial<Record<string, number>> = {
  teb: 48,
};

const BANK_BAR_LOGO_HEIGHT: Partial<Record<string, number>> = {
  akbank: 40,
  garanti: 28,
  teb: 44,
  hsbc: 44,
  albaraka: 44,
  ziraat: 36,
};

export default function PaymentGateway({
  amount,
  errorType,
  loading = false,
  initialData,
  onPay,
  onFormChange,
}: PaymentGatewayProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'other'>('card');
  const [otherMethod, setOtherMethod] = useState<'juzdan' | 'tosla' | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [form, setForm] = useState<PaymentFormData>({
    cardName: initialData?.cardName || '',
    cardNumber: initialData?.cardNumber || '',
    expiryDate: initialData?.expiryDate || '',
    cvv: initialData?.cvv || '',
    rememberCard: initialData?.rememberCard || false,
  });
  const [blockDebitCards, setBlockDebitCards] = useState(false);

  useEffect(() => {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBlockDebitCards(!!data.data.blockDebitCards);
        }
      })
      .catch(() => {});
  }, []);

  const paymentError = getPaymentError(errorType);
  const formattedAmount = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const cleanedCard = form.cardNumber.replace(/\s/g, '');
  const bank = cleanedCard.length >= 6 ? detectBankBrand(cleanedCard) : null;
  const isDebitCard =
    blockDebitCards && cleanedCard.length >= 6 && detectCardFundingType(cleanedCard) === 'DEBIT';
  const showInstallments = cleanedCard.length >= 6 && !isDebitCard;
  const installmentOptions = useMemo(() => buildInstallmentOptions(amount), [amount]);
  const selectedInstallmentOption =
    installmentOptions.find((option) => option.installments === selectedInstallment) ??
    installmentOptions[0];

  const updateForm = (patch: Partial<PaymentFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      onFormChange?.(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'other') {
      if (!otherMethod) return;
    }
    if (isDebitCard) return;
    onPay(form);
  };

  const tabClass = (tab: 'card' | 'other') =>
    `flex-1 rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold transition-colors ${
      activeTab === tab
        ? 'border-[#0066cc] text-[#0066cc] bg-white'
        : 'border-gray-200 text-gray-500 bg-gray-50 hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-[#eef1f4] px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
          >
            TÜRKÇE
            <FiChevronDown size={14} />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-2 p-3 sm:p-4">
            <button type="button" onClick={() => setActiveTab('card')} className={tabClass('card')}>
              Kart ile Ödeme
            </button>
            <button type="button" onClick={() => setActiveTab('other')} className={tabClass('other')}>
              Diğer Ödeme Yöntemleri
            </button>
          </div>

          {paymentError && (
            <div className="mx-4 mb-0 rounded-lg border border-red-200 bg-red-50 px-3 py-3 sm:mx-5">
              <p className="text-sm font-bold text-red-700">{paymentError.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-red-600">{paymentError.message}</p>
              {paymentError.action && (
                <p className="mt-1 text-xs text-red-500">{paymentError.action}</p>
              )}
            </div>
          )}

          {activeTab === 'card' ? (
            <form onSubmit={handleSubmit} className="p-4 sm:p-5">
              {showInstallments ? (
                <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
                    Taksit Seçenekleri
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {installmentOptions.map((option) => (
                      <label
                        key={option.installments}
                        className={`flex cursor-pointer items-center justify-between gap-3 border-b border-gray-100 px-3 py-2.5 text-sm last:border-b-0 ${
                          selectedInstallment === option.installments ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="installment"
                            checked={selectedInstallment === option.installments}
                            onChange={() => setSelectedInstallment(option.installments)}
                            className="h-4 w-4 border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
                          />
                          <span className="font-semibold text-gray-800">{option.label}</span>
                        </span>
                        <span className="font-bold text-[#0066cc]">
                          {option.installments === 1
                            ? `₺${formatInstallmentPrice(option.monthlyAmount)}`
                            : `₺${formatInstallmentPrice(option.monthlyAmount)} x ${option.installments}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-gray-700">
                  <FiInfo className="mt-0.5 shrink-0 text-[#0066cc]" size={14} />
                  <span>Taksit seçeneklerini görmek için kart bilgilerinizi girin</span>
                </div>
              )}

              {isDebitCard && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  Banka kartları desteklenmemektedir. Lütfen kredi kartı ile ödeme yapınız.
                </div>
              )}

              {bank && bank.id !== 'generic' && cleanedCard.length >= 6 && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-900">
                  <div className="flex shrink-0 items-center">
                    <BankLogoFromBrand
                      bank={bank}
                      height={BANK_BAR_LOGO_HEIGHT[bank.id] ?? 26}
                    />
                  </div>
                  <CardSchemeBadge cardNumber={cleanedCard} compact />
                </div>
              )}

              {(!bank || bank.id === 'generic') && cleanedCard.length >= 1 && (
                <div className="mb-4 flex justify-end">
                  <CardSchemeBadge cardNumber={cleanedCard} />
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Kart Üzerindeki Ad, Soyad"
                  value={form.cardName}
                  onChange={(e) => updateForm({ cardName: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0066cc]"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Kart Numarası"
                  value={form.cardNumber}
                  onChange={(e) => updateForm({ cardNumber: formatCardNumber(e.target.value) })}
                  required
                  maxLength={19}
                  className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-[#0066cc] ${
                    errorType === 'cardNumber' ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Son Kullanma Tarihi"
                    value={form.expiryDate}
                    onChange={(e) => updateForm({ expiryDate: formatExpiry(e.target.value) })}
                    required
                    maxLength={5}
                    className={`w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-[#0066cc] ${
                      errorType === 'expiryDate' ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <div className="relative">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="CVV"
                      value={form.cvv}
                      onChange={(e) =>
                        updateForm({ cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
                      }
                      required
                      maxLength={3}
                      className={`w-full rounded-lg border px-4 py-3 pr-10 text-sm outline-none focus:border-[#0066cc] ${
                        errorType === 'cvv' ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <FiHelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={form.rememberCard}
                  onChange={(e) => updateForm({ rememberCard: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Kolay ödeme için kartımı hatırla
                <FiHelpCircle className="text-gray-400" size={14} />
              </label>

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ödemeniz Gereken Tutar</span>
                  <span className="text-lg font-bold text-gray-900">{formattedAmount} TL</span>
                </div>
                {showInstallments && selectedInstallment > 1 && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs">
                    <span className="text-gray-600">Seçilen taksit</span>
                    <span className="font-bold text-[#0066cc]">
                      {selectedInstallmentOption.label} — ₺{formatInstallmentPrice(selectedInstallmentOption.monthlyAmount)} / ay
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || isDebitCard}
                className="mt-4 w-full rounded-lg bg-[#0066cc] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005bb5] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? 'İşleniyor...' : 'Ödeme Yap'}
              </button>
            </form>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-gray-700">
                <FiInfo className="mt-0.5 shrink-0 text-[#0066cc]" size={14} />
                <span>Diğer Ödeme Yöntemleri ile kolay ödeme yapın</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'juzdan' as const, label: 'Juzdan ile Öde', badge: 'J' },
                  { id: 'tosla' as const, label: 'Tosla', badge: 'T' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setOtherMethod(method.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      otherMethod === method.id
                        ? 'border-[#0066cc] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        otherMethod === method.id ? 'border-[#0066cc]' : 'border-gray-300'
                      }`}
                    >
                      {otherMethod === method.id && (
                        <span className="h-2 w-2 rounded-full bg-[#0066cc]" />
                      )}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${
                        method.id === 'juzdan' ? 'bg-purple-600' : 'bg-red-600'
                      }`}
                    >
                      {method.badge}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-600">Ödemeniz Gereken Tutar</span>
                <span className="text-lg font-bold text-gray-900">{formattedAmount} TL</span>
              </div>

              <button
                type="button"
                disabled={!otherMethod || loading}
                onClick={() => onPay(form)}
                className="mt-4 w-full rounded-lg bg-[#0066cc] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005bb5] disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? 'İşleniyor...' : 'Ödeme Yap'}
              </button>
            </div>
          )}

          <PaymentTrustBadges />

          <div className="border-t border-gray-100 py-3 text-center text-xs text-gray-500">
            <button type="button" className="hover:text-gray-700">
              Gizlilik
            </button>
            <span className="mx-2">|</span>
            <button type="button" className="hover:text-gray-700">
              Aydınlatma Metni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
