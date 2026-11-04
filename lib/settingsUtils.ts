import type { Settings } from '@/lib/db/types';
import { normalizeStoreMode } from '@/lib/storeThemes';

const SETTINGS_DEFAULTS: Pick<
  Settings,
  | 'businessName'
  | 'siteActive'
  | 'mobileOnly'
  | 'blockDebitCards'
  | 'adminSoundEnabled'
  | 'adminSoundVolume'
  | 'storeMode'
> = {
  businessName: 'A101',
  siteActive: true,
  mobileOnly: false,
  blockDebitCards: false,
  adminSoundEnabled: true,
  adminSoundVolume: 80,
  storeMode: 'a101',
};

function clampAdminSoundVolume(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 80;
  return Math.max(0, Math.min(100, Math.round(num)));
}

export function normalizeSettings(settings: Settings): Settings {
  return {
    ...SETTINGS_DEFAULTS,
    ...settings,
    storeMode: normalizeStoreMode(settings.storeMode),
    adminSoundVolume: clampAdminSoundVolume(settings.adminSoundVolume),
  };
}

export function mergeSettingsUpdate(current: Settings, patch: Partial<Settings>): Settings {
  const merged: Settings = {
    ...current,
    ...patch,
    _id: current._id,
    updatedAt: new Date().toISOString(),
  };

  if (patch.storeMode !== undefined) {
    merged.storeMode = normalizeStoreMode(patch.storeMode);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === '') {
      delete (merged as unknown as Record<string, unknown>)[key];
    }
  }

  return normalizeSettings(merged);
}
