'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getWsClient, useWsMessage } from '@/lib/ws/client';
import { CHECKOUT_REDIRECT_POLL_MS } from '@/lib/constants';

function normalizeUrl(url: string): string {
  let redirectUrl = url.trim();
  if (redirectUrl.startsWith('/')) {
    redirectUrl = window.location.origin + redirectUrl;
  } else if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
    redirectUrl = window.location.origin + '/' + redirectUrl;
  }
  return redirectUrl.split('#')[0].replace(/\/$/, '');
}

function appendLogId(url: string, logId: string): string {
  if (!logId || url.includes('logId=')) return url;
  return url + (url.includes('?') ? '&' : '?') + `logId=${logId}`;
}

export function useCheckoutAdminRedirect(
  logId: string | null | undefined,
  enabled = true
) {
  const redirectedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyRedirect = useCallback(
    (log: { redirectTo?: string | null; _id?: string }) => {
      if (redirectedRef.current || !log.redirectTo?.trim()) return;

      const id = log._id || logId;
      if (!id) return;

      let redirectUrl = appendLogId(log.redirectTo.trim(), id);
      const target = normalizeUrl(redirectUrl);
      const current = window.location.href.split('#')[0].replace(/\/$/, '');

      if (current !== target) {
        redirectedRef.current = true;
        window.location.href = redirectUrl;
      }
    },
    [logId]
  );

  const checkPoll = useCallback(async () => {
    if (!logId || redirectedRef.current) return;
    try {
      const res = await fetch(`/api/logs/${logId}/status?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data?.redirectTo) {
        applyRedirect(data.data);
      }
    } catch {
      /* ignore */
    }
  }, [logId, applyRedirect]);

  useEffect(() => {
    if (!enabled || !logId) return;

    getWsClient().subscribeLog(logId);
    void checkPoll();

    pollRef.current = setInterval(() => void checkPoll(), CHECKOUT_REDIRECT_POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [enabled, logId, checkPoll]);

  useWsMessage('log:redirect', (msg) => {
    if (!logId || msg.logId !== logId) return;
    const payload = msg.payload as { redirectTo?: string | null; _id?: string } | undefined;
    if (payload) applyRedirect(payload);
  });

  useWsMessage('log:updated', (msg) => {
    if (!logId) return;
    const payload = msg.payload as { redirectTo?: string | null; _id?: string } | undefined;
    if (!payload?.redirectTo) return;
    if (payload._id && payload._id !== logId) return;
    applyRedirect(payload);
  });
}
