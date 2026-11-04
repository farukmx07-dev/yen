import type { VisitorLogData } from './visitorLogger';

export function resolveStorefrontPageType(pathname: string, search = ''): VisitorLogData | null {
  if (!pathname || pathname.startsWith('/admin')) return null;

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (pathname === '/checkout/waiting') return { pageType: 'waiting' };
  if (pathname === '/checkout/processing') return { pageType: 'processing' };
  if (pathname === '/checkout/success' || pathname === '/checkout/error') return { pageType: 'payment' };
  if (pathname.startsWith('/checkout/payment')) return { pageType: 'payment' };
  if (pathname.startsWith('/checkout')) return { pageType: 'address' };
  if (pathname === '/cart') return { pageType: 'cart' };

  const productMatch = pathname.match(/^\/products\/([^/?#]+)/);
  if (productMatch) return { pageType: 'productDetail', productId: productMatch[1] };

  if (pathname === '/' || pathname === '') return { pageType: 'homepage' };

  if (pathname === '/products' || pathname.startsWith('/products')) {
    if (params.get('firsat') === '1') return { pageType: 'campaign' };
    return { pageType: 'homepage' };
  }

  if (pathname === '/kampanyalar' || pathname.startsWith('/kampanyalar')) {
    return { pageType: 'campaign' };
  }

  if (
    pathname.startsWith('/search') ||
    pathname.startsWith('/categories') ||
    pathname === '/indirim'
  ) {
    return { pageType: 'homepage' };
  }

  return null;
}
