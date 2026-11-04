import type { StoreMode } from '@/lib/storeThemes';

export interface StoreCopy {
  label: string;
  productsSectionTitle: string;
  homeResultsLabel: string;
  productBadge: string | null;
  installmentBadge: string | null;
  productDetailInstallment: string;
  campaignBannerBadge: string;
  campaignBannerTitle: string;
  campaignModalTitle: string;
  bannerSlideTitle: string;
  deliveryNote: string;
  returnPolicyIntro: string;
  returnShippingNote: string;
  copyright: string;
  merchantName: string;
  supportPhone: string;
  footerFeaturedTitle: string;
}

const STORE_COPY: Record<StoreMode, StoreCopy> = {
  a101: {
    label: 'A101',
    productsSectionTitle: 'Sadece Online Özel - A101',
    homeResultsLabel: 'Eylül Fırsatları',
    productBadge: 'ALDIN ALDIN! EKSTRA',
    installmentBadge: 'Peşin Fiyatına 12 Taksit',
    productDetailInstallment: 'Peşin Fiyatına 12 Taksit',
    campaignBannerBadge: "Online'a Özel",
    campaignBannerTitle: 'Aldın Aldın Fırsatları!',
    campaignModalTitle: 'Fırsat Ürünleri',
    bannerSlideTitle: 'Eylül Fırsatları',
    deliveryNote: 'Ürünler A101 tarafından teslim edilir.',
    returnPolicyIntro:
      'A101 olarak müşteri memnuniyetini ön planda tutuyoruz. İade ve değişim işlemleriniz için aşağıdaki koşullar geçerlidir.',
    returnShippingNote:
      'İade kargo ücreti müşteriye aittir. Ancak ürün hatası veya yanlış ürün gönderimi durumunda kargo ücreti A101 tarafından karşılanır.',
    copyright: '© 2025 A101 Ekstra',
    merchantName: 'A101',
    supportPhone: '0850 532 0 532',
    footerFeaturedTitle: 'Aldın Aldın',
  },
  carrefoursa: {
    label: 'CarrefourSA',
    productsSectionTitle: 'Sadece Online Özel - CarrefourSA',
    homeResultsLabel: 'Günün Öne Çıkan Ürünleri',
    productBadge: 'Online Market',
    installmentBadge: null,
    productDetailInstallment: 'Online Market Fiyatı',
    campaignBannerBadge: 'Online Market',
    campaignBannerTitle: 'Günün Öne Çıkan Ürünleri',
    campaignModalTitle: 'Kampanyalı Ürünler',
    bannerSlideTitle: 'Haftanın Fırsatları',
    deliveryNote: 'Ürünler CarrefourSA tarafından teslim edilir.',
    returnPolicyIntro:
      'CarrefourSA olarak müşteri memnuniyetini ön planda tutuyoruz. İade ve değişim işlemleriniz için aşağıdaki koşullar geçerlidir.',
    returnShippingNote:
      'İade kargo ücreti müşteriye aittir. Ancak ürün hatası veya yanlış ürün gönderimi durumunda kargo ücreti CarrefourSA tarafından karşılanır.',
    copyright: '© 2026 CarrefourSA',
    merchantName: 'CarrefourSA',
    supportPhone: '444 1 000',
    footerFeaturedTitle: 'Online Market',
  },
  bim: {
    label: 'BİM',
    productsSectionTitle: 'Sadece Online Özel - BİM',
    homeResultsLabel: 'Aktüel Ürünler',
    productBadge: 'BİM Aktüel',
    installmentBadge: 'Peşin Fiyat',
    productDetailInstallment: 'Peşin Fiyat',
    campaignBannerBadge: 'Aktüel',
    campaignBannerTitle: 'BİM Aktüel Fırsatları',
    campaignModalTitle: 'Aktüel Ürünler',
    bannerSlideTitle: 'Aktüel Ürünler',
    deliveryNote: 'Ürünler BİM tarafından teslim edilir.',
    returnPolicyIntro:
      'BİM olarak müşteri memnuniyetini ön planda tutuyoruz. İade ve değişim işlemleriniz için aşağıdaki koşullar geçerlidir.',
    returnShippingNote:
      'İade kargo ücreti müşteriye aittir. Ancak ürün hatası veya yanlış ürün gönderimi durumunda kargo ücreti BİM tarafından karşılanır.',
    copyright: '© 2026 BİM',
    merchantName: 'BİM',
    supportPhone: '444 4 246',
    footerFeaturedTitle: 'BİM Aktüel',
  },
  sokmarket: {
    label: 'Şok Market',
    productsSectionTitle: 'Sadece Online Özel - Şok Market',
    homeResultsLabel: 'Haftanın Fırsatları',
    productBadge: 'Cepte Şok',
    installmentBadge: 'Kampanyalı Fiyat',
    productDetailInstallment: 'Kampanyalı Fiyat',
    campaignBannerBadge: 'Cepte Şok',
    campaignBannerTitle: 'Haftanın Fırsatları',
    campaignModalTitle: 'Kampanyalı Ürünler',
    bannerSlideTitle: 'Haftanın Fırsatları',
    deliveryNote: 'Ürünler Şok Market tarafından teslim edilir.',
    returnPolicyIntro:
      'Şok Market olarak müşteri memnuniyetini ön planda tutuyoruz. İade ve değişim işlemleriniz için aşağıdaki koşullar geçerlidir.',
    returnShippingNote:
      'İade kargo ücreti müşteriye aittir. Ancak ürün hatası veya yanlış ürün gönderimi durumunda kargo ücreti Şok Market tarafından karşılanır.',
    copyright: '© 2026 Şok Market',
    merchantName: 'Şok Market',
    supportPhone: '0850 808 00 00',
    footerFeaturedTitle: 'Cepte Şok',
  },
};

export function getStoreCopy(mode: unknown): StoreCopy {
  if (typeof mode === 'string' && mode in STORE_COPY) {
    return STORE_COPY[mode as StoreMode];
  }
  return STORE_COPY.a101;
}
