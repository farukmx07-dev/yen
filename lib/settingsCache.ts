import type { PublicSettingsSnapshot } from '@/lib/publicSettings';

let cached: PublicSettingsSnapshot | null = null;
let cachedAt = 0;
const MAX_AGE_MS = 5 * 60 * 1000;

export function setSettingsCache(settings: PublicSettingsSnapshot): void {
  cached = settings;
  cachedAt = Date.now();
}

export function getSettingsCache(): PublicSettingsSnapshot | null {
  if (!cached) return null;
  if (Date.now() - cachedAt > MAX_AGE_MS) return null;
  return cached;
}
