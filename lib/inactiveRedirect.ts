import type { NextRequest } from 'next/server';
import { INACTIVE_SITE_REDIRECT_URL } from '@/lib/constants';

export const STOREFRONT_ACCESS_COOKIE = 'storefront_access';
export const STOREFRONT_ACCESS_MAX_AGE = 60 * 60 * 24;

export function resolveInactiveRedirectUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    return trimmed;
  }
  return INACTIVE_SITE_REDIRECT_URL;
}

export function hasStorefrontAccess(request: NextRequest): boolean {
  return request.cookies.get(STOREFRONT_ACCESS_COOKIE)?.value === '1';
}

export function hasStorefrontAccessClient(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((part) => {
    const [name, value] = part.trim().split('=');
    return name === STOREFRONT_ACCESS_COOKIE && value === '1';
  });
}

function isLocalDevHostname(hostname: string): boolean {
  const host = hostname.split(':')[0].toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function shouldRedirectRootFromHost(hostHeader: string): boolean {
  const host = hostHeader.split(',')[0]?.trim() || '';
  if (!host) return process.env.NODE_ENV === 'production';
  return !isLocalDevHostname(host);
}

export function shouldRedirectRootToInactiveSite(request: NextRequest): boolean {
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.split(',')[0]?.trim() ||
    request.nextUrl.hostname;
  return shouldRedirectRootFromHost(host);
}
