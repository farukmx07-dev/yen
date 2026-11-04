export interface InstallmentOption {
  installments: number;
  label: string;
  monthlyAmount: number;
}

export const INSTALLMENT_COUNTS = [1, 3, 6, 12] as const;

export function buildInstallmentOptions(totalAmount: number): InstallmentOption[] {
  return INSTALLMENT_COUNTS.map((installments) => ({
    installments,
    label: installments === 1 ? 'Tek Çekim' : `${installments} Taksit`,
    monthlyAmount: totalAmount / installments,
  }));
}

export function formatInstallmentPrice(amount: number): string {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
