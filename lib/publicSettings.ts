import type { NextRequest } from 'next/server';
import type { Settings } from '@/lib/db/types';
import { settingsDb } from '@/lib/db';
import { getClientIp } from '@/lib/ipUtils';

export interface PublicSettingsSnapshot {
  siteActive?: boolean;
  mobileOnly?: boolean;
  storeMode?: string;
  inactiveRedirectUrl?: string;
  blockDebitCards?: boolean;
  businessName?: string;
  isIpBanned?: boolean;
}

export function toPublicSettings(settings: Settings, request: NextRequest) {
  const { bannedIps, ...rest } = settings;
  const ip = getClientIp(request);
  return {
    ...rest,
    isIpBanned: settingsDb.isIpBanned(settings, ip),
  };
}

export function toSettingsBroadcastPayload(settings: Settings): PublicSettingsSnapshot {
  const { bannedIps: _bannedIps, ...rest } = settings;
  return rest;
}
