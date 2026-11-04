import type { Log } from '@/lib/db/types';
import type { LiveVisitorStats } from '@/lib/liveVisitorStats';

export type WsMessageType =
  | 'connected'
  | 'auth:ok'
  | 'subscribed'
  | 'pong'
  | 'live:sync'
  | 'log:created'
  | 'log:updated'
  | 'log:deleted'
  | 'log:redirect'
  | 'stats:update'
  | 'settings:update';

export interface WsMessage<T = unknown> {
  type: WsMessageType | string;
  payload?: T;
  ts?: number;
  logId?: string;
  stats?: LiveVisitorStats;
  logs?: Log[];
}

declare global {
  // eslint-disable-next-line no-var
  var __wsHub: {
    broadcastAdmin: (msg: WsMessage) => void;
    broadcastLog: (logId: string, msg: WsMessage) => void;
    broadcastAll: (msg: WsMessage) => void;
    hasAdminClients?: () => boolean;
  } | null;
}

export function getServerWsHub() {
  if (global.__wsHub) return global.__wsHub;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWsHub } = require('./hub') as { getWsHub?: () => typeof global.__wsHub };
    return getWsHub?.() ?? null;
  } catch {
    return null;
  }
}

export function broadcastAdminLive(message: WsMessage): void {
  getServerWsHub()?.broadcastAdmin(message);
}

export function broadcastLogUpdate(log: Log, event: 'log:created' | 'log:updated' = 'log:updated'): void {
  const hub = getServerWsHub();
  if (!hub) return;

  hub.broadcastAdmin({ type: event, payload: log, ts: Date.now() });

  if (log.redirectTo) {
    hub.broadcastLog(log._id, {
      type: 'log:redirect',
      payload: log,
      logId: log._id,
      ts: Date.now(),
    });
  }
}

export function broadcastLogDeleted(logId: string): void {
  getServerWsHub()?.broadcastAdmin({ type: 'log:deleted', logId, ts: Date.now() });
}

export function broadcastLiveSync(logs: Log[], stats: LiveVisitorStats): void {
  getServerWsHub()?.broadcastAdmin({
    type: 'live:sync',
    logs,
    stats,
    ts: Date.now(),
  });
}

export function broadcastSettingsUpdate(settings: unknown): void {
  getServerWsHub()?.broadcastAll({ type: 'settings:update', payload: settings, ts: Date.now() });
}
