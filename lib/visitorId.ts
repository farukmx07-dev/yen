import { randomBytes } from 'crypto';
import { settingsDb } from './db';

function fallbackVisitorId(): string {
  return `U${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function allocateVisitorId(existingId?: string | null): Promise<string> {
  if (existingId) return existingId;

  try {
    const settings = await settingsDb.get();
    const next = (settings.nextVisitorSeq ?? 0) + 1;
    await settingsDb.update({ nextVisitorSeq: next });
    return `U${String(next).padStart(5, '0')}`;
  } catch {
    return fallbackVisitorId();
  }
}
