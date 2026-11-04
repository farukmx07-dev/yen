import type { NextRequest } from 'next/server';

export function normalizeIp(ip: string): string {
  const trimmed = ip.split(',')[0].trim();
  if (!trimmed) return 'unknown';
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  if (trimmed === '::1') return '127.0.0.1';
  return trimmed;
}

export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const raw = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
  return normalizeIp(raw);
}
