'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WsMessage } from '@/lib/ws/broadcast';

type MessageHandler = (msg: WsMessage) => void;
type AuthType = 'auth:admin' | 'auth:visitor';

function resolveWsUrl(): string {
  if (typeof window === 'undefined') return '';

  const envUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (envUrl) return envUrl;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 15000;
  private intentionalClose = false;
  private authPayload: Record<string, unknown> | null = null;
  private authType: AuthType | null = null;
  private pendingSubscriptions = new Set<string>();

  connected = false;

  ensureConnected() {
    this.intentionalClose = false;
    this.open();
  }

  connect(authType: AuthType, payload: Record<string, unknown>) {
    this.authType = authType;
    this.authPayload = payload;
    this.ensureConnected();

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(authType, payload);
    }
  }

  subscribeLog(logId: string) {
    if (!logId) return;
    this.pendingSubscriptions.add(logId);
    this.ensureConnected();

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send('subscribe:log', { logId });
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  send(type: string, payload?: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload }));
  }

  disconnect() {
    this.intentionalClose = true;
    this.clearPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  private open() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = resolveWsUrl();
    if (!url) return;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectDelay = 1000;
      if (this.authType && this.authPayload) {
        this.send(this.authType, this.authPayload);
      }
      for (const logId of this.pendingSubscriptions) {
        this.send('subscribe:log', { logId });
      }
      this.startPing();
      this.emit({ type: 'ws:open' });
    };

    this.ws.onmessage = (event) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      this.emit(msg);
      if (msg.type) this.emit({ ...msg, type: msg.type });
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.ws = null;
      this.clearPing();
      this.emit({ type: 'ws:close' });
      if (!this.intentionalClose) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private startPing() {
    this.clearPing();
    this.pingTimer = setInterval(() => {
      this.send('ping');
    }, 25_000);
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.intentionalClose || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
  }

  private emit(msg: WsMessage) {
    const type = msg.type;
    if (!type) return;
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) handler(msg);
    }
    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      for (const handler of allHandlers) handler(msg);
    }
  }
}

let singleton: WsClient | null = null;

export function getWsClient(): WsClient {
  if (!singleton) singleton = new WsClient();
  return singleton;
}

export function useWsMessage(type: string, handler: MessageHandler, deps: unknown[] = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getWsClient();
    client.ensureConnected();
    const unsub = client.on(type, (msg) => handlerRef.current(msg));
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}

export function useWsConnected() {
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

  return connected;
}

export function useWsConnect(
  authType: AuthType | null,
  payload: Record<string, unknown> | null
) {
  useEffect(() => {
    if (!authType || !payload) return;
    const client = getWsClient();
    client.connect(authType, payload);
  }, [authType, JSON.stringify(payload)]);
}

export function useLogSubscription(logId: string | null | undefined) {
  const subscribe = useCallback(() => {
    if (!logId) return;
    getWsClient().subscribeLog(logId);
  }, [logId]);

  useEffect(() => {
    subscribe();
  }, [subscribe]);

  return subscribe;
}
