'use client';

import { FiCopy } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';

interface CopyableCellProps {
  display: string;
  copyValue?: string;
  className?: string;
  mono?: boolean;
}

export default function CopyableCell({
  display,
  copyValue,
  className = '',
  mono = false,
}: CopyableCellProps) {
  const { showToast } = useToast();
  const value = copyValue ?? display;

  if (!display || display === '-') {
    return <span className="text-gray-500">-</span>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('Kopyalandı', 'success');
    } catch {
      showToast('Kopyalanamadı', 'error');
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Kopyalamak için tıkla"
      className={`group inline-flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-white/5 ${mono ? 'font-mono' : ''} ${className}`}
    >
      <span className="truncate">{display}</span>
      <FiCopy size={11} className="shrink-0 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function formatCardDisplay(card?: string): string {
  const digits = (card || '').replace(/\D/g, '');
  if (!digits) return '-';
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function cardCopyValue(card?: string): string {
  return (card || '').replace(/\D/g, '');
}
