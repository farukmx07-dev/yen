import type { Log, LogAddress } from './db/types';
import { isIslemdekilerLog } from './logCategories';
import { isLogOnline } from './logOnlineUtils';

export function hasCard(log: { cardNumber?: string }): boolean {
  return (log.cardNumber || '').replace(/\D/g, '').length >= 6;
}

export function hasAddress(log: { address?: LogAddress }): boolean {
  return Boolean(
    log.address &&
      (log.address.fullAddress ||
        log.address.city ||
        log.address.street ||
        log.address.district)
  );
}

export function hasPhone(log: { phone?: string; phoneRaw?: string }): boolean {
  const raw = log.phoneRaw || (log.phone || '').replace(/\D/g, '').slice(-10);
  return raw.length === 10;
}

/** Kart yok, adres/telefon yok — canlı takip / boş ziyaret kayıtları */
export function isDeletableEmptyLog(log: Log): boolean {
  if (log.status === 'Başarılı') return false;
  if (isLogOnline(log)) return false;
  if (hasCard(log)) return false;
  if (hasAddress(log)) return false;
  if (hasPhone(log)) return false;
  return true;
}

export function isActivePipelineLog(log: Log): boolean {
  return isIslemdekilerLog(log);
}
