import type { StoreMode } from '@/lib/storeThemes';

const STORE_PRODUCT_PREFIX: Record<StoreMode, string> = {
  a101: 'a101',
  carrefoursa: 'carrefoursa',
  bim: 'bim',
  sokmarket: 'sok',
};

export function getStoreProductIdPrefix(storeMode: StoreMode): string {
  return STORE_PRODUCT_PREFIX[storeMode];
}

/** Görüntüleme için ürün kodunu aktif mağaza önekine çevirir (DB id değişmez). */
export function formatProductIdForStore(productId: string, storeMode: StoreMode): string {
  const prefix = getStoreProductIdPrefix(storeMode);
  if (productId.startsWith('a101-')) {
    return productId.replace(/^a101-/, `${prefix}-`);
  }
  return productId;
}

export interface LiveStatusRoutes {
  homepage: string;
  productDetail: string;
  cart: string;
  address: string;
  payment: string;
}

export function getLiveStatusRoutes(storeMode: StoreMode): LiveStatusRoutes {
  const prefix = getStoreProductIdPrefix(storeMode);
  return {
    homepage: '/',
    productDetail: `/products/${prefix}-19`,
    cart: '/cart',
    address: '/checkout',
    payment: '/checkout/payment',
  };
}
