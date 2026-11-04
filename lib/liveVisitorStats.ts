import type { Log } from '@/lib/db/types';
import { isLogOnline } from '@/lib/logOnlineUtils';
import { hasCard } from '@/lib/logQualify';
import { hasCheckoutAddressEngagement, isOnAddressStep } from '@/lib/logCategories';
import { normalizeIp } from '@/lib/ipUtils';

export interface LiveVisitorStats {
  total: number;
  homepage: number;
  productDetail: number;
  cart: number;
  address: number;
  payment: number;
}

type Bucket = keyof Omit<LiveVisitorStats, 'total'>;

export function isStorefrontLog(log: Log): boolean {
  if (log.pageType === 'admin' || log.status === 'Admin Paneli') return false;
  if (log.status === 'Başarılı') return false;
  if (log.onlineStatus === 'Pasif') return false;
  return true;
}

/** Aktif storefront ziyaretçisi — heartbeat veya checkout oturumu */
export function isLiveForStats(log: Log): boolean {
  if (!isStorefrontLog(log)) return false;
  if (log.onlineStatus !== 'Aktif') return false;
  if (isLogOnline(log)) return true;
  if (hasCard(log)) return true;
  if (isOnAddressStep(log) && hasCheckoutAddressEngagement(log)) return true;
  return false;
}

export function dedupeVisitorLogs<T extends Log>(logs: T[]): T[] {
  const uniqueMap = new Map<string, T>();

  for (const log of logs) {
    let key = log._id;

    if (log.visitorSessionId) {
      key = `session_${log.visitorSessionId}`;
    } else if (log.phone) {
      const cleanPhone = log.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length >= 10) {
        key = `phone_${cleanPhone}`;
      }
    }

    if (key === log._id && log.phoneRaw && log.phoneRaw.length === 10) {
      key = `phone_${log.phoneRaw}`;
    }

    if (key === log._id && log.ipAddress && log.ipAddress !== 'Unknown' && log.ipAddress !== 'unknown') {
      const cleanIp = normalizeIp(log.ipAddress);
      if (cleanIp) {
        key = `ip_${cleanIp}`;
      }
    }

    const existing = uniqueMap.get(key);
    if (
      !existing ||
      new Date(log.updatedAt || log.createdAt).getTime() >
        new Date(existing.updatedAt || existing.createdAt).getTime()
    ) {
      uniqueMap.set(key, log);
    }
  }

  return Array.from(uniqueMap.values());
}

export function classifyLiveLog(log: Log): Bucket {
  const pt = log.pageType || '';

  if (['payment', 'waiting', 'processing'].includes(pt)) return 'payment';
  if (pt === 'address') return hasCheckoutAddressEngagement(log) ? 'address' : 'cart';
  if (pt === 'cart') return 'cart';
  if (pt === 'productDetail') return 'productDetail';
  if (pt === 'homepage' || pt === 'campaign') return 'homepage';

  const paymentStatuses = [
    '3D Secure Bekliyor',
    'Ödeme Sayfasında',
    'Ödeme Sayfası',
    'Hata',
    'Hatalı Kod Girişi',
    'Bekliyor',
  ];
  if (log.status && paymentStatuses.includes(log.status)) return 'payment';
  if (log.status === 'Adres Ekranında' || log.status === 'Adres Tamamlandı' || log.status === 'Checkout Sayfasında') {
    return 'address';
  }
  if (log.status === 'Sepette') return 'cart';
  if (log.status === 'Ürün Detay') return 'productDetail';
  if (log.status === 'Ana Sayfa') return 'homepage';

  if (hasCard(log)) return 'payment';
  return 'homepage';
}

export function computeLiveVisitorStats(logs: Log[]): LiveVisitorStats {
  const liveLogs = dedupeVisitorLogs(logs).filter(isLiveForStats);

  const buckets: Record<Bucket, number> = {
    homepage: 0,
    productDetail: 0,
    cart: 0,
    address: 0,
    payment: 0,
  };

  for (const log of liveLogs) {
    buckets[classifyLiveLog(log)] += 1;
  }

  return {
    total: liveLogs.length,
    ...buckets,
  };
}
