import type { BankBrand } from '@/lib/cardUtils';

export interface BankThreeDSecureProps {
  bank: BankBrand;
  amount: string;
  cardNumber: string;
  phoneNumber: string;
  phoneLast4: string;
  verificationCode: string;
  onVerificationCodeChange: (value: string) => void;
  error: string;
  loading: boolean;
  transactionDate: string;
  merchantName?: string;
  onSubmit: (e: React.FormEvent) => void;
  onResendCode: () => void;
  onCancel: () => void;
}
