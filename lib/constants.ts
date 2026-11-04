export const INACTIVE_SITE_REDIRECT_URL =
  'https://tr.wikipedia.org/wiki/Berat_Efe_Parlar';

export function isLegacyIndirimPath(pathname: string): boolean {
  return pathname === '/indirim' || pathname.startsWith('/indirim/');
}

export const ADMIN_POLL_MS = 3000;
export const ADMIN_LIVE_POLL_MS = 3000;
export const STOREFRONT_SETTINGS_POLL_MS = 15_000;
export const VISITOR_HEARTBEAT_MS = 30_000;
export const CHECKOUT_REDIRECT_POLL_MS = 3000;
export const ONLINE_WINDOW_MS = 120_000;
