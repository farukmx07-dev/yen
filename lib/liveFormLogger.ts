import { getVisitorLogId, getVisitorSessionId, setVisitorLogId, clearVisitorLogId } from './visitorSession';
import { getWsClient } from './ws/client';

export const LIVE_LOG_DEBOUNCE_MS = 400;

export async function postLogHeartbeat(payload: {
  logId?: string;
  pageType?: string;
  amount?: number;
}): Promise<boolean> {
  const logId = payload.logId || getVisitorLogId();
  if (!logId) return false;

  try {
    const res = await fetch('/api/logs/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      body: JSON.stringify({
        logId,
        pageType: payload.pageType,
        amount: payload.amount,
        visitorSessionId: getVisitorSessionId() || undefined,
      }),
    });

    const raw = await res.text();
    if (!raw.trim()) return false;

    let data: { success?: boolean; skipped?: boolean; data?: { _id?: string } };
    try {
      data = JSON.parse(raw);
    } catch {
      return false;
    }

    if (data.success && data.data?._id) {
      setVisitorLogId(data.data._id);
      getWsClient().subscribeLog(data.data._id);
      return true;
    }

    if (data.skipped) {
      clearVisitorLogId();
    }
    return false;
  } catch {
    return false;
  }
}

export async function postLiveLog(payload: Record<string, unknown>): Promise<string | null> {
  const body = {
    ...payload,
    visitorSessionId: getVisitorSessionId() || undefined,
    logId: (payload.logId as string | undefined) || getVisitorLogId() || undefined,
  };

  try {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success && data.data?._id) {
      setVisitorLogId(data.data._id);
      getWsClient().subscribeLog(data.data._id);
      return data.data._id as string;
    }

    if (data.skipped && body.logId) {
      clearVisitorLogId();
    }

    return null;
  } catch {
    return null;
  }
}
