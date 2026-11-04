import type { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/ipUtils';
import { isMobileOrTabletUserAgent } from '@/lib/deviceUtils';
import { resolvePublicOrigin } from '@/lib/requestOrigin';
import { getSettingsCache } from '@/lib/settingsCache';

export interface VisitorAccessSettings {
  siteActive?: boolean;
  mobileOnly?: boolean;
  isIpBanned?: boolean;
  inactiveRedirectUrl?: string;
}

export function shouldBlockVisitor(
  data: VisitorAccessSettings,
  userAgent: string
): boolean {
  if (data.isIpBanned) return true;
  if (data.siteActive === false) return true;
  if (data.mobileOnly && !isMobileOrTabletUserAgent(userAgent)) return true;
  return false;
}

function internalSettingsApiUrl(): string {
  const hostname = process.env.HOSTNAME?.trim() || '127.0.0.1';
  const port = process.env.PORT?.trim() || '3000';
  return `http://${hostname}:${port}/api/settings`;
}

export async function fetchVisitorAccess(
  request: NextRequest,
  clientIp: string
): Promise<VisitorAccessSettings | null> {
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')?.split(',')[0]?.trim();
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';

  const candidateUrls = [
    internalSettingsApiUrl(),
    new URL('/api/settings', resolvePublicOrigin(request)).toString(),
  ];

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${baseUrl}?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'x-forwarded-for': clientIp,
          'x-real-ip': clientIp,
          'x-forwarded-proto': proto,
          ...(host ? { host, 'x-forwarded-host': host } : {}),
        },
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.success && data.data) {
        return data.data as VisitorAccessSettings;
      }
    } catch {
      /* sıradaki URL */
    }
  }

  return null;
}

export async function getVisitorAccess(request: NextRequest) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';
  const access = (await fetchVisitorAccess(request, clientIp)) ?? getSettingsCache();
  return {
    clientIp,
    userAgent,
    access,
    blocked: access ? shouldBlockVisitor(access, userAgent) : false,
  };
}
