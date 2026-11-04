'use client';

import { detectCardScheme } from '@/lib/cardUtils';

interface CardSchemeBadgeProps {
  cardNumber: string;
  compact?: boolean;
  variant?: 'default' | 'akbank';
}

function VisaLogo({ compact }: { compact?: boolean }) {
  const height = compact ? 18 : 20;
  const width = compact ? 42 : 46;

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ height, width }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banks/visa.png"
        alt="Visa"
        className="absolute inset-0 h-full w-full object-contain object-left"
      />
    </div>
  );
}

export default function CardSchemeBadge({
  cardNumber,
  compact = false,
  variant = 'default',
}: CardSchemeBadgeProps) {
  const scheme = detectCardScheme(cardNumber);
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 1) {
    return null;
  }

  if (scheme.id === 'visa') {
    if (variant === 'akbank') {
      return <VisaLogo compact={false} />;
    }
    return (
      <div className={`flex items-center gap-1.5 ${compact ? '' : 'pt-1'}`}>
        <VisaLogo compact={compact} />
        {!compact && (
          <div className="leading-none">
            <p className="text-[7px] font-semibold uppercase text-gray-500">Verified by Visa</p>
          </div>
        )}
      </div>
    );
  }

  if (scheme.id === 'mastercard') {
    if (variant === 'akbank') {
      return (
        <div className="flex flex-col items-end leading-none">
          <div className="flex items-center">
            <span className="h-5 w-5 rounded-full bg-[#eb001b]" />
            <span className="-ml-2.5 h-5 w-5 rounded-full bg-[#f79e1b]" />
          </div>
          <span className="mt-0.5 text-[9px] font-bold lowercase text-gray-800">mastercard</span>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-1 ${compact ? '' : 'pt-1'}`}>
        <div className="flex">
          <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
          <span className="-ml-2 h-4 w-4 rounded-full bg-[#f79e1b]" />
        </div>
        {!compact && (
          <div className="leading-none">
            <p className="text-[8px] font-bold uppercase text-gray-700">Mastercard</p>
            <p className="text-[7px] font-semibold uppercase text-gray-500">ID Check</p>
          </div>
        )}
      </div>
    );
  }

  if (scheme.id === 'amex') {
    const height = compact ? 34 : 40;
    const zoom = 2.2;
    const viewWidth = height * 1.05;

    return (
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ height, width: viewWidth }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banks/amex.png"
          alt="American Express"
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          style={{ height: height * zoom }}
        />
      </div>
    );
  }

  if (scheme.id === 'troy') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/banks/troy.png"
        alt="Troy"
        className={`${compact ? 'h-7' : 'h-8'} w-auto max-w-[120px] object-contain`}
      />
    );
  }

  return null;
}
