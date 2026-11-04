'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { computeLiveVisitorStats, type LiveVisitorStats } from '@/lib/liveVisitorStats';
import { dedupeAdminLogs } from '@/lib/adminLogDedupe';
import { sortLogsByRecent } from '@/lib/logSort';
import type { Log } from '@/lib/db/types';
import { getWsClient, useWsMessage, useWsConnected } from '@/lib/ws/client';
import { getAdminSession } from '@/lib/adminAuth';

interface AdminLiveContextValue {
  logs: Log[];
  visitorStats: LiveVisitorStats;
  loading: boolean;
  refresh: () => Promise<void>;
  lastSyncAt: number;
  wsConnected: boolean;
}

const AdminLiveContext = createContext<AdminLiveContextValue | null>(null);

const LOG_FETCH_LIMIT = 2000;
const MAX_LOG_BUFFER = 2500;

function liveFetch(url: string) {
  return fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
}

function upsertAdminLog(prev: Log[], log: Log): Log[] {
  const idx = prev.findIndex((item) => item._id === log._id);
  const merged =
    idx >= 0
      ? sortLogsByRecent(dedupeAdminLogs(prev.map((item) => (item._id === log._id ? { ...item, ...log } : item))))
      : sortLogsByRecent(dedupeAdminLogs([log, ...prev]));
  return merged.slice(0, MAX_LOG_BUFFER);
}

function applyLogs(
  rawLogs: Log[],
  setLogs: (logs: Log[]) => void,
  setVisitorStats: (stats: LiveVisitorStats) => void,
  stats?: LiveVisitorStats
) {
  const uniqueLogs = sortLogsByRecent(dedupeAdminLogs(rawLogs)).slice(0, MAX_LOG_BUFFER);
  setLogs(uniqueLogs);
  setVisitorStats(stats ?? computeLiveVisitorStats(uniqueLogs));
}

export function AdminLiveProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wsConnected = useWsConnected();
  const [logs, setLogs] = useState<Log[]>([]);
  const [visitorStats, setVisitorStats] = useState<LiveVisitorStats>({
    total: 0,
    homepage: 0,
    productDetail: 0,
    cart: 0,
    address: 0,
    payment: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const inFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    inFlightRef.current = true;

    const ts = Date.now();
    let synced = false;

    try {
      const liveRes = await liveFetch(`/api/admin/live?limit=${LOG_FETCH_LIMIT}&t=${ts}`);
      const liveData = await liveRes.json();

      if (liveData.success && liveData.data) {
        if (Array.isArray(liveData.data.logs)) {
          applyLogs(liveData.data.logs as Log[], setLogs, setVisitorStats, liveData.data.stats);
          synced = true;
        }
      }
    } catch {
      /* fallback below */
    }

    if (!synced) {
      try {
        const logsRes = await liveFetch(`/api/logs?limit=${LOG_FETCH_LIMIT}&t=${ts}`);
        const logsData = await logsRes.json();
        if (logsData.success && Array.isArray(logsData.data)) {
          applyLogs(logsData.data as Log[], setLogs, setVisitorStats);
          synced = true;
        }
      } catch {
        /* ignore */
      }
    }

    if (synced) {
      setLastSyncAt(Date.now());
    }

    setLoading(false);
    inFlightRef.current = false;

    if (pendingRefreshRef.current) {
      pendingRefreshRef.current = false;
      void refresh();
    }
  }, []);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    const admin = getAdminSession();
    if (admin) {
      getWsClient().connect('auth:admin', { adminId: admin.id });
    }

    void refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [pathname, refresh]);

  useWsMessage('live:sync', (msg) => {
    if (Array.isArray(msg.logs)) {
      applyLogs(msg.logs as Log[], setLogs, setVisitorStats, msg.stats);
      setLastSyncAt(Date.now());
      setLoading(false);
    }
  });

  useWsMessage('stats:update', (msg) => {
    if (msg.stats) {
      setVisitorStats(msg.stats as LiveVisitorStats);
      setLastSyncAt(Date.now());
    }
  });

  useWsMessage('log:created', (msg) => {
    const log = msg.payload as Log | undefined;
    if (!log?._id) return;
    setLogs((prev) => upsertAdminLog(prev, log));
    setLastSyncAt(Date.now());
  });

  useWsMessage('log:updated', (msg) => {
    const log = msg.payload as Log | undefined;
    if (!log?._id) return;
    setLogs((prev) => upsertAdminLog(prev, log));
    setLastSyncAt(Date.now());
  });

  useWsMessage('log:deleted', (msg) => {
    if (!msg.logId) return;
    setLogs((prev) => prev.filter((l) => l._id !== msg.logId));
    setLastSyncAt(Date.now());
  });

  const value = useMemo(
    () => ({ logs, visitorStats, loading, refresh, lastSyncAt, wsConnected }),
    [logs, visitorStats, loading, refresh, lastSyncAt, wsConnected]
  );

  return <AdminLiveContext.Provider value={value}>{children}</AdminLiveContext.Provider>;
}

export function useAdminLive() {
  const ctx = useContext(AdminLiveContext);
  if (!ctx) {
    throw new Error('useAdminLive must be used within AdminLiveProvider');
  }
  return ctx;
}
