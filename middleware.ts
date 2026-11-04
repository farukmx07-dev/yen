import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isLegacyIndirimPath } from '@/lib/constants';
import { getVisitorAccess } from '@/lib/siteAccess';
import { publicRedirectUrl } from '@/lib/requestOrigin';
import {
  hasStorefrontAccess,
  resolveInactiveRedirectUrl,
  shouldRedirectRootToInactiveSite,
  STOREFRONT_ACCESS_COOKIE,
  STOREFRONT_ACCESS_MAX_AGE,
} from '@/lib/inactiveRedirect';

function inactiveRedirect(request: NextRequest, url?: string | null) {
  return NextResponse.redirect(resolveInactiveRedirectUrl(url), 302);
}

function setStorefrontAccessCookie(request: NextRequest, response: NextResponse) {
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(STOREFRONT_ACCESS_COOKIE, '1', {
    maxAge: STOREFRONT_ACCESS_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure,
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === 'POST' && request.headers.get('next-action')) {
    return NextResponse.json(
      { error: 'Sayfa güncellendi, lütfen yenileyin.' },
      { status: 409, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isLegacyIndirimPath(pathname)) {
    const response = NextResponse.redirect(publicRedirectUrl(request, '/products'));
    return setStorefrontAccessCookie(request, response);
  }

  const { blocked, access } = await getVisitorAccess(request);
  const storefrontAccess = hasStorefrontAccess(request);

  if (pathname === '/' || pathname === '') {
    if (shouldRedirectRootToInactiveSite(request)) {
      return inactiveRedirect(request, access?.inactiveRedirectUrl);
    }
    return NextResponse.redirect(publicRedirectUrl(request, '/products'));
  }

  const siteInactive = access?.siteActive === false;

  if (siteInactive) {
    return inactiveRedirect(request, access?.inactiveRedirectUrl);
  }

  if (blocked && !storefrontAccess) {
    return inactiveRedirect(request, access?.inactiveRedirectUrl);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
