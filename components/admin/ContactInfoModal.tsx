'use client';

import { FiCopy, FiX } from 'react-icons/fi';
import { useToast } from '@/components/ToastProvider';
import type { LogAddress } from './LogTable';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  phone?: string;
  email?: string;
  ipAddress?: string;
  address?: LogAddress;
}

function formatAddress(address?: LogAddress): string {
  if (!address) return '-';
  if (address.fullAddress?.trim()) return address.fullAddress.trim();

  const line1 = [address.neighborhood, address.street, address.buildingNo && `No: ${address.buildingNo}`]
    .filter(Boolean)
    .join(' ');
  const line2 = [address.floor && `Kat: ${address.floor}`, address.apartmentNo && `Daire: ${address.apartmentNo}`]
    .filter(Boolean)
    .join(' ');
  const line3 = [address.district, address.city].filter(Boolean).join(' / ');

  return [line1, line2, line3].filter(Boolean).join('\n') || '-';
}

function formatIp(ip?: string) {
  if (!ip || ip === 'Unknown' || ip === 'unknown') return '-';
  return ip.split(',')[0].trim();
}

export default function ContactInfoModal({
  isOpen,
  onClose,
  name,
  phone,
  email,
  ipAddress,
  address,
}: ContactInfoModalProps) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const addressText = formatAddress(address);
  const ip = formatIp(ipAddress);

  const rows = [
    { label: 'Ad Soyad', value: name || '-' },
    { label: 'Telefon', value: phone || '-' },
    { label: 'E-posta', value: email || '-' },
    { label: 'IP Adresi', value: ip },
    { label: 'Adres', value: addressText },
  ];

  const copyAll = async () => {
    const text = rows.map((r) => `${r.label}: ${r.value}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Tüm bilgiler kopyalandı', 'success');
    } catch {
      showToast('Kopyalanamadı', 'error');
    }
  };

  const copyField = async (value: string) => {
    if (!value || value === '-') return;
    try {
      await navigator.clipboard.writeText(value);
      showToast('Kopyalandı', 'success');
    } catch {
      showToast('Kopyalanamadı', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2a3142] bg-[#151922] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2a3142] px-5 py-4">
          <h3 className="text-base font-bold text-white">İletişim Bilgileri</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
            <FiX size={18} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border border-[#2a3142] bg-[#1a1f2b] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{row.label}</p>
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap break-words text-sm text-gray-200">{row.value}</p>
                {row.value !== '-' && (
                  <button
                    type="button"
                    onClick={() => copyField(row.value)}
                    className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white"
                    title="Kopyala"
                  >
                    <FiCopy size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#2a3142] px-5 py-4">
          <button
            type="button"
            onClick={copyAll}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Tümünü Kopyala
          </button>
        </div>
      </div>
    </div>
  );
}
