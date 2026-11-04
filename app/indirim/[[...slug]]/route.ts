import { NextRequest, NextResponse } from 'next/server';
import { publicRedirectUrl } from '@/lib/requestOrigin';
import {
  STOREFRONT_ACCESS_COOKIE,
  STOREFRONT_ACCESS_MAX_AGE,
} from '@/lib/inactiveRedirect';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(publicRedirectUrl(request, '/products'));
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
