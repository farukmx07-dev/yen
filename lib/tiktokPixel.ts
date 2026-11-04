export type TikTokEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'CompletePayment'
  | 'Search'
  | 'Contact'
  | 'ClickButton';

interface TtqInstance {
  track: (event: string, payload?: Record<string, unknown>) => void;
  page: () => void;
}

declare global {
  interface Window {
    ttq?: TtqInstance;
  }
}

export function sanitizeTiktokPixelId(id: string): string {
  const clean = id.replace(/[^A-Za-z0-9]/g, '');
  if (!/^[A-Z0-9]{18,25}$/i.test(clean)) {
    return '';
  }
  return clean.toUpperCase();
}

export function hasTiktokScriptInCode(code?: string | null): boolean {
  if (!code?.trim()) {
    return false;
  }
  const loadMatch = code.match(/ttq\.load\s*\(\s*['"]([^'"]+)['"]\s*\)/i);
  return Boolean(loadMatch?.[1] && sanitizeTiktokPixelId(loadMatch[1]));
}

export function resolveTiktokPixelId(settings: {
  tiktokPixelId?: string;
  pixelCode?: string;
}): string {
  const explicit = settings.tiktokPixelId?.trim();
  if (explicit) {
    return sanitizeTiktokPixelId(explicit);
  }

  const code = settings.pixelCode?.trim() || '';
  const loadMatch = code.match(/ttq\.load\(['"]([^'"]+)['"]\)/i);
  if (loadMatch?.[1]) {
    return sanitizeTiktokPixelId(loadMatch[1]);
  }

  return '';
}

export interface CartAnalyticsItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function getCartAnalytics(): {
  value: number;
  currency: string;
  contents: Array<{
    content_id: string;
    content_name: string;
    quantity: number;
    price: number;
  }>;
} {
  if (typeof window === 'undefined') {
    return { value: 0, currency: 'TRY', contents: [] };
  }

  const cart: CartAnalyticsItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
  const value = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const contents = cart.map((item) => ({
    content_id: item.productId,
    content_name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  return { value, currency: 'TRY', contents };
}

export function trackTikTok(event: TikTokEvent | string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.ttq) {
    return;
  }

  try {
    window.ttq.track(event, payload);
  } catch {
    /* ignore */
  }
}

export function trackTikTokPageView() {
  if (typeof window === 'undefined' || !window.ttq) {
    return;
  }

  try {
    window.ttq.page();
  } catch {
    /* ignore */
  }
}

export function trackTikTokOnce(
  event: TikTokEvent | string,
  payload?: Record<string, unknown>,
  storageKey?: string
) {
  if (typeof window === 'undefined') {
    return;
  }

  const key = storageKey || `ttq_${event}`;
  if (sessionStorage.getItem(key)) {
    return;
  }

  trackTikTok(event, payload);
  sessionStorage.setItem(key, '1');
}

const INTERACTIVE_SELECTOR = [
  'button',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[role="button"]',
  'a[href]',
].join(', ');

export function resolveInteractiveLabel(el: Element): string {
  const node = el as HTMLElement;
  const aria = node.getAttribute('aria-label')?.trim();
  if (aria) {
    return aria.slice(0, 120);
  }

  const value = (node as HTMLInputElement).value?.trim();
  if (value) {
    return value.slice(0, 120);
  }

  const title = node.getAttribute('title')?.trim();
  if (title) {
    return title.slice(0, 120);
  }

  const text = node.textContent?.replace(/\s+/g, ' ').trim();
  if (text) {
    return text.slice(0, 120);
  }

  if (node.tagName === 'A') {
    const href = node.getAttribute('href')?.trim();
    if (href) {
      return href.slice(0, 120);
    }
  }

  return node.tagName.toLowerCase();
}

export function findInteractiveClickTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const el = target.closest(INTERACTIVE_SELECTOR);
  if (!el || el.closest('[data-no-ttq-button]')) {
    return null;
  }

  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
    if (el.disabled) {
      return null;
    }
  }

  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href');
    if (!href || href === '#') {
      return null;
    }
  }

  return el;
}

export function trackTikTokButtonClick(el: Element) {
  trackTikTok('ClickButton', {
    button_text: resolveInteractiveLabel(el),
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    page_url: typeof window !== 'undefined' ? window.location.href : '',
  });
}
