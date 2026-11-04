'use client';

import { useEffect } from 'react';
import { getWsClient } from '@/lib/ws/client';
import type { PublicSettingsSnapshot } from '@/lib/publicSettings';
import { emitSettingsUpdate } from '@/lib/settingsRuntime';

export default function SettingsWsListener() {
  useEffect(() => {
    const client = getWsClient();
    const unsub = client.on('settings:update', (msg) => {
      const payload = msg.payload as PublicSettingsSnapshot | undefined;
      if (!payload || typeof payload !== 'object') return;
      emitSettingsUpdate(payload);
    });
    return unsub;
  }, []);

  return null;
}
