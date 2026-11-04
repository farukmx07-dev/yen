'use client';

import type { BankBrand } from '@/lib/cardUtils';
import {
  GenericBankLogo,
  getBankLogoColor,
  resolveBankLogoComponent,
  type BankLogoProps,
  type BankLogoVariant,
} from './BankLogos';

interface BankLogoComponentProps extends BankLogoProps {
  bankId: string;
  bankName?: string;
  variant?: BankLogoVariant;
}

export default function BankLogo({
  bankId,
  bankName,
  variant = 'full',
  className,
  height,
}: BankLogoComponentProps) {
  const Logo = resolveBankLogoComponent(bankId, variant);

  if (Logo) {
    return <Logo className={className} height={height} />;
  }

  return (
    <GenericBankLogo
      className={className}
      height={height}
      label={bankName ?? bankId}
      color={getBankLogoColor(bankId)}
    />
  );
}

export function BankLogoFromBrand({
  bank,
  variant = 'full',
  className,
  height,
}: {
  bank: BankBrand;
  variant?: BankLogoVariant;
} & BankLogoProps) {
  return (
    <BankLogo
      bankId={bank.id}
      bankName={bank.name}
      variant={variant}
      className={className}
      height={height}
    />
  );
}
