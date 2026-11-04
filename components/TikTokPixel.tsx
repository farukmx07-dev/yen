'use client';

import Script from 'next/script';
import { sanitizeTiktokPixelId } from '@/lib/tiktokPixel';

interface TikTokPixelProps {
  pixelId: string;
}

export default function TikTokPixel({ pixelId }: TikTokPixelProps) {
  const safeId = sanitizeTiktokPixelId(pixelId);
  if (!safeId) {
    return null;
  }

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject = t;
          var ttq = w[t] = w[t] || [];
          ttq.methods = [
            'page','track','identify','instances','debug','on','off','once','ready',
            'alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'
          ];
          ttq.setAndDefer = function (target, method) {
            target[method] = function () {
              target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
          }
          ttq.instance = function (id) {
            var instance = ttq._i[id] || [];
            for (var n = 0; n < ttq.methods.length; n++) {
              ttq.setAndDefer(instance, ttq.methods[n]);
            }
            return instance;
          };
          ttq.load = function (id, options) {
            var src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            ttq._i = ttq._i || {};
            ttq._i[id] = [];
            ttq._i[id]._u = src;
            ttq._t = ttq._t || {};
            ttq._t[id] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[id] = options || {};
            var script = d.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = src + '?sdkid=' + id + '&lib=' + t;
            var first = d.getElementsByTagName('script')[0];
            first.parentNode.insertBefore(script, first);
          };
          ttq.load('${safeId}');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  );
}
