'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getWsClient, useWsConnect } from '@/lib/ws/client';
import { getAdminSession } from '@/lib/adminAuth';
import { getVisitorLogId, getVisitorSessionId } from '@/lib/visitorSession';

interface WebSocketContextValue {
  subscribeLog: (logId: string) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

function VisitorWsConnector() {
  const [logId, setLogId] = useState(() => getVisitorLogId());

  useEffect(() => {
    const sync = () => setLogId(getVisitorLogId());
    sync();
    const interval = setInterval(sync, 1500);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  useWsConnect('auth:visitor', {
    logId: logId || undefined,
    visitorSessionId: getVisitorSessionId() || undefined,
  });

  useEffect(() => {
    if (logId) getWsClient().subscribeLog(logId);
  }, [logId]);

  return null;
}

function AdminWsConnector() {
  const admin = getAdminSession();
  useWsConnect(admin ? 'auth:admin' : null, admin ? { adminId: admin.id } : null);
  return null;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') && pathname !== '/admin/login';
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = getWsClient();
    client.ensureConnected();

    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);
    const unsubOpen = client.on('ws:open', onOpen);
    const unsubClose = client.on('ws:close', onClose);
    setConnected(client.connected);
    return () => {
      unsubOpen();
      unsubClose();
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        subscribeLog: (logId) => getWsClient().subscribeLog(logId),
        isConnected: connected,
      }}
    >
      {isAdmin ? <AdminWsConnector /> : <VisitorWsConnector />}
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}

export function useCheckoutRedirectListener(
  logId: string | null,
  onRedirect: (log: { redirectTo?: string | null; _id?: string }) => void
) {
  const { subscribeLog } = useWebSocket();

  useEffect(() => {
    if (!logId) return;
    subscribeLog(logId);

    const client = getWsClient();
    const unsub = client.on('log:redirect', (msg) => {
      const payload = msg.payload as { redirectTo?: string | null; _id?: string } | undefined;
      if (!payload?.redirectTo) return;
      if (msg.logId && msg.logId !== logId) return;
      onRedirect(payload);
    });
    return () => {
      unsub();
    };
  }, [logId, onRedirect, subscribeLog]);
}
