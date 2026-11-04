export type CampaignStatus = 'upcoming' | 'active' | 'ended' | 'unset';

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function formatCampaignDateTr(iso?: string | null): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCampaignStatus(
  startIso?: string | null,
  endIso?: string | null,
  now = Date.now()
): CampaignStatus {
  if (!startIso && !endIso) return 'unset';
  const start = startIso ? new Date(startIso).getTime() : null;
  const end = endIso ? new Date(endIso).getTime() : null;
  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'ended';
  if (start || end) return 'active';
  return 'unset';
}

export function computeTimeLeft(endIso?: string | null): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  if (!endIso) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }
  const totalMs = Math.max(0, new Date(endIso).getTime() - Date.now());
  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, totalMs };
}
