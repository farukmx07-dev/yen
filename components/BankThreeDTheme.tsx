'use client';

import { detectBankBrand, detectCardScheme, maskCardNumber } from '@/lib/cardUtils';
import { BankLogoFromBrand } from '@/components/banks/logos/BankLogo';

interface BankThreeDHeaderProps {
  cardNumber: string;
}

export function BankThreeDHeader({ cardNumber }: BankThreeDHeaderProps) {
  const bank = detectBankBrand(cardNumber);
  const scheme = detectCardScheme(cardNumber);

  return (
    <div style={{ backgroundColor: bank.headerBg }} className="py-3 sm:py-4 md:py-5">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="truncate text-[10px] font-black uppercase tracking-wide sm:text-xs"
              style={{ color: bank.textColor }}
            >
              {bank.headerTitle}
            </p>
            <p className="mt-0.5 truncate text-[9px] opacity-90 sm:text-[10px]" style={{ color: bank.textColor }}>
              {bank.name}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="rounded px-2 py-1 text-[9px] font-black tracking-wide sm:text-[10px]"
              style={{ backgroundColor: scheme.bgColor, color: scheme.textColor }}
            >
              {scheme.label}
            </span>
            <div className="rounded-lg bg-white/95 px-2 py-1">
              <BankLogoFromBrand bank={bank} height={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BankThreeDSummaryProps {
  cardNumber: string;
  amount: string;
  merchantName?: string;
  transactionDate: string;
}

export function BankThreeDSummary({
  cardNumber,
  amount,
  merchantName = 'A101',
  transactionDate,
}: BankThreeDSummaryProps) {
  const bank = detectBankBrand(cardNumber);
  const scheme = detectCardScheme(cardNumber);

  return (
    <div
      className="mb-4 overflow-hidden rounded-xl border bg-gray-50 sm:mb-5 md:mb-6"
      style={{ borderColor: `${bank.primaryColor}33` }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ backgroundColor: `${bank.primaryColor}12` }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Banka</p>
          <p className="text-sm font-black" style={{ color: bank.primaryColor }}>
            {bank.name}
          </p>
        </div>
        <span
          className="rounded-md px-2.5 py-1 text-[10px] font-black"
          style={{ backgroundColor: scheme.bgColor, color: scheme.textColor }}
        >
          {scheme.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4">
        <div>
          <p className="mb-0.5 text-[10px] text-gray-500 sm:text-xs">İşyeri Adı</p>
          <p className="text-xs font-semibold text-gray-900 sm:text-sm">{merchantName}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] text-gray-500 sm:text-xs">İşlem Tutarı</p>
          <p className="text-sm font-black sm:text-base md:text-lg" style={{ color: bank.primaryColor }}>
            {parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] text-gray-500 sm:text-xs">İşlem Tarihi</p>
          <p className="break-words text-xs font-semibold text-gray-900 sm:text-sm">{transactionDate}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] text-gray-500 sm:text-xs">Kart Numarası</p>
          <p className="break-words font-mono text-xs font-semibold text-gray-900 sm:text-sm">
            {maskCardNumber(cardNumber)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function useBankTheme(cardNumber: string) {
  return detectBankBrand(cardNumber);
}
