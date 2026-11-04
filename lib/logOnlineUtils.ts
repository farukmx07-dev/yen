import { ONLINE_WINDOW_MS } from '@/lib/constants';

export function isLogOnline(
  log: {
    onlineStatus?: string;
    updatedAt?: string;
    createdAt?: string;
  },
  now = Date.now()
): boolean {
  if (log.onlineStatus === 'Pasif') return false;
  const ts = new Date(log.updatedAt || log.createdAt || 0).getTime();
  if (!ts) return log.onlineStatus === 'Aktif';
  return now - ts < ONLINE_WINDOW_MS;
}

export const ONLINE_WINDOW_MINUTES = ONLINE_WINDOW_MS / 60_000;
