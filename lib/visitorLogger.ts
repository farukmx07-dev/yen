import { getClientUserAgent } from './userAgentParser';
import { getVisitorLogId, getVisitorSessionId, setVisitorLogId, clearVisitorLogId } from './visitorSession';
import { setupInactiveListener } from './setLogInactive';
import { safeJsonParse } from './safeStorage';
import { VISITOR_HEARTBEAT_MS } from './constants';
import { getWsClient } from './ws/client';

export interface VisitorLogData {
  pageType:
    | 'homepage'
    | 'productDetail'
    | 'cart'
    | 'payment'
    | 'address'
    | 'waiting'
    | 'processing'
    | 'campaign'
    | 'admin';
  productId?: string;
}

const HEARTBEAT_MS = VISITOR_HEARTBEAT_MS;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let inactiveListenerReady = false;
let currentTracking: VisitorLogData | null = null;
let lastSentAt = 0;

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function readCartTotal(): number {
  if (typeof window === 'undefined') return 0;
  const cart = safeJsonParse<Array<{ price: number; quantity: number }>>(
    localStorage.getItem('cart'),
    []
  );
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
}

async function sendLog(data: VisitorLogData): Promise<boolean> {
  const payload = { ...data };

  try {
    const user = safeJsonParse<{ name?: string; surname?: string; phone?: string }>(
      localStorage.getItem('user'),
      {}
    );
    const name =
      user.name && user.surname ? `${user.name} ${user.surname}` : user.phone || 'Ziyaretçi';
    const phone = user.phone || '';

    const logData: Record<string, unknown> = {
      name,
      phone: phone || undefined,
      pageType: payload.pageType,
      productId: payload.productId || undefined,
      amount: 0,
      userAgent: getClientUserAgent(),
      visitorSessionId: getVisitorSessionId() || undefined,
      logId: payload.pageType === 'admin' ? undefined : getVisitorLogId() || undefined,
    };

    if (payload.pageType === 'cart' || payload.pageType === 'payment' || payload.pageType === 'address') {
      logData.amount = readCartTotal();
    }

    const res = await fetch('/api/visitors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      keepalive: true,
      body: JSON.stringify(logData),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result.success) {
      if (result.error?.includes('bulunamad') || res.status === 404) {
        clearVisitorLogId();
      }
      return false;
    }

    if (result.skipped && !result.data?.logId) {
      return false;
    }

    if (result.data?.logId && payload.pageType !== 'admin') {
      setVisitorLogId(result.data.logId);
      lastSentAt = Date.now();
      const client = getWsClient();
      client.connect('auth:visitor', {
        logId: result.data.logId,
        visitorSessionId: getVisitorSessionId() || undefined,
      });
      client.subscribeLog(result.data.logId);
    }

    return Boolean(result.success);
  } catch {
    return false;
  }
}

function ensureHeartbeat() {
  if (typeof window === 'undefined') return;
  if (heartbeatTimer) return;

  heartbeatTimer = setInterval(() => {
    if (currentTracking) {
      void sendLog(currentTracking);
    }
  }, HEARTBEAT_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentTracking) {
      void sendLog(currentTracking);
    }
  });

  window.addEventListener('focus', () => {
    if (currentTracking) {
      void sendLog(currentTracking);
    }
  });

  if (!inactiveListenerReady) {
    setupInactiveListener();
    inactiveListenerReady = true;
  }
}

export function clearVisitorTracking() {
  currentTracking = null;
  stopHeartbeat();
}

export async function logVisitor(data: VisitorLogData) {
  try {
    if (data.pageType === 'admin') {
      clearVisitorTracking();
      return;
    }

    const sent = await sendLog(data);
    if (sent && getVisitorLogId()) {
      currentTracking = data;
      ensureHeartbeat();
    } else {
      currentTracking = null;
      stopHeartbeat();
    }
  } catch (error) {
    console.error('Ziyaretçi loglama hatası:', error);
  }
}

export function getVisitorTrackingState() {
  return { currentTracking, lastSentAt, heartbeatActive: Boolean(heartbeatTimer) };
}
