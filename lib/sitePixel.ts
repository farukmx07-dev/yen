import { hasTiktokScriptInCode, sanitizeTiktokPixelId } from '@/lib/tiktokPixel';

/** index.html head script — pixel ID buradan değiştirilir */
export const SITE_TIKTOK_PIXEL_ID = 'D8S69PRC77U9LDPEE3OG';
export const SITE_TIKTOK_ENABLED = true;

export function buildTiktokPixelScript(pixelId: string): string {
  const safeId = sanitizeTiktokPixelId(pixelId);
  if (!safeId) {
    return '';
  }

  return `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(n,s)};
  ttq.load('${safeId}');
  ttq.page();
}(window, document, 'ttq');`;
}

export function getEffectiveTiktokPixelId(adminPixelId?: string, pixelCode?: string): string {
  if (!SITE_TIKTOK_ENABLED) {
    return '';
  }

  const fromAdmin = adminPixelId?.trim() ? sanitizeTiktokPixelId(adminPixelId) : '';
  if (fromAdmin) {
    return fromAdmin;
  }

  if (hasTiktokScriptInCode(pixelCode)) {
    return '';
  }

  return sanitizeTiktokPixelId(SITE_TIKTOK_PIXEL_ID);
}

export function getSiteTiktokHeadScript(adminPixelId?: string, pixelCode?: string): string {
  const pixelId = getEffectiveTiktokPixelId(adminPixelId, pixelCode);
  return buildTiktokPixelScript(pixelId);
}

export function shouldRunTiktokTrackers(adminPixelId?: string, pixelCode?: string): boolean {
  return Boolean(getEffectiveTiktokPixelId(adminPixelId, pixelCode)) || hasTiktokScriptInCode(pixelCode);
}
