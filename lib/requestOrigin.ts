import type { NextRequest } from 'next/server';

function isLocalHost(host: string): boolean {
  const hostname = host.split(':')[0].toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function originFromEnv(): string | undefined {
  for (const key of ['APP_URL', 'SERVER_APP_URL', 'SITE_URL', 'NEXT_SERVER_APP_URL']) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      continue;
    }
  }
  return undefined;
}

export function resolvePublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();

  const host = forwardedHost || hostHeader;
  if (host && !isLocalHost(host)) {
    const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https';
    return `${proto}://${host}`;
  }

  const envOrigin = originFromEnv();
  if (envOrigin && !isLocalHost(new URL(envOrigin).host)) {
    return envOrigin;
  }

  return request.nextUrl.origin;
}

export function publicRedirectUrl(request: NextRequest, path: string): URL {
  const origin = resolvePublicOrigin(request);
  const base = origin.endsWith('/') ? origin : `${origin}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, base);
}
