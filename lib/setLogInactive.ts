import { getVisitorLogId, getVisitorSessionId } from './visitorSession';

export async function setLogInactive() {
  try {
    const currentLogId = typeof window !== 'undefined' ? getVisitorLogId() : null;
    const visitorSessionId = getVisitorSessionId() || undefined;

    if (!currentLogId && !visitorSessionId) {
      return;
    }

    const data = {
      logId: currentLogId || undefined,
      visitorSessionId,
    };

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/logs/set-inactive', blob);
    } else {
      fetch('/api/logs/set-inactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Log pasif yapma hatası:', error);
  }
}

export function setupInactiveListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      setLogInactive();
    }
  });
}
