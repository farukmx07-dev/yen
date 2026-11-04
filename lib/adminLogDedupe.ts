import type { Log } from '@/lib/db/types';

/** Admin listesinde yalnızca aynı _id tekrarlarını temizle — ziyaretçi birleştirmesi yapma. */
export function dedupeAdminLogs<T extends Log>(logs: T[]): T[] {
  const seen = new Map<string, T>();

  for (const log of logs) {
    const existing = seen.get(log._id);
    if (
      !existing ||
      new Date(log.updatedAt || log.createdAt || 0).getTime() >
        new Date(existing.updatedAt || existing.createdAt || 0).getTime()
    ) {
      seen.set(log._id, log);
    }
  }

  return Array.from(seen.values());
}
