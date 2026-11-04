const PAGE_LABELS: Record<string, string> = {
  homepage: 'Ana Sayfa',
  campaign: 'Kampanyalar',
  productDetail: 'Ürün Detay',
  cart: 'Sepet',
  address: 'Adres',
  payment: 'Ödeme',
  waiting: '3D Bekliyor',
  processing: 'İşleniyor',
};

export function livePageLabel(pageType?: string, status?: string): string {
  if (status === 'Checkout Sayfasında') return 'Checkout';
  if (pageType && PAGE_LABELS[pageType]) return PAGE_LABELS[pageType];
  if (status) return status;
  return 'Ziyaretçi';
}
