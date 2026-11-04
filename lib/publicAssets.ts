export const BRAND_ASSETS = {
  a101: {
    logo: '/brands/a101/a101-logo-2_5F256x256.png',
    qrIcon: '/brands/a101/a101_qr_icon.png',
    ekstra: '/brands/a101/extra-logo_512x512.png',
    kapida: '/brands/a101/kapida-logo_512x512.png',
  },
  badges: {
    etbis: '/brands/badges/etbis.png',
    trGo: '/brands/badges/tr_go.png',
  },
  appStores: {
    googlePlay: '/brands/app-stores/android-market-logo.png',
    appStore: '/brands/app-stores/apple-market-logo.png',
  },
} as const;

export const PAYMENT_ASSETS = {
  bkmGo: '/payments/BkmGOLogo.png',
  troyTagline: '/payments/TROY-Logo-Tagline.png',
} as const;

export const PRODUCT_IMAGE_DIR = '/products';
export const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><text x="200" y="210" text-anchor="middle" font-size="48" fill="#9ca3af">📦</text></svg>'
  );

const ROOT_PRODUCT_IMAGE = /^\/[^/]+\.(jpg|jpeg|png|webp)$/i;

export function resolveProductImagePath(src?: string | null): string {
  if (!src) return PRODUCT_PLACEHOLDER;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  if (src.startsWith(`${PRODUCT_IMAGE_DIR}/`)) return src;
  if (ROOT_PRODUCT_IMAGE.test(src)) {
    return `${PRODUCT_IMAGE_DIR}${src}`;
  }
  return src;
}
