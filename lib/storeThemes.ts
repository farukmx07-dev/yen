export type StoreMode = 'a101' | 'carrefoursa' | 'bim' | 'sokmarket';

export interface StoreTheme {
  id: StoreMode;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  headerStyle: 'a101-triple' | 'single-brand';
  tagline?: string;
  headerBg: string;
  headerText: string;
  accent: string;
}

export const STORE_MODES: StoreMode[] = ['a101', 'carrefoursa', 'bim', 'sokmarket'];

export const STORE_THEMES: Record<StoreMode, StoreTheme> = {
  a101: {
    id: 'a101',
    label: 'A101',
    shortLabel: 'A101',
    title: 'A101 Market - En Taze Ürünler, En Uygun Fiyatlar',
    description: 'Binlerce ürün çeşidi ile ihtiyacınız olan her şey burada!',
    headerStyle: 'a101-triple',
    headerBg: '#5BC0C0',
    headerText: '#ffffff',
    accent: '#2196F3',
  },
  carrefoursa: {
    id: 'carrefoursa',
    label: 'CarrefourSA',
    shortLabel: 'CarrefourSA',
    title: 'CarrefourSA - Online Market Alışverişi',
    description: 'CarrefourSA ile online market alışverişi — taze ürünler, uygun fiyatlar.',
    headerStyle: 'single-brand',
    tagline: 'SA Market',
    headerBg: '#004E97',
    headerText: '#ffffff',
    accent: '#E2001A',
  },
  bim: {
    id: 'bim',
    label: 'BİM',
    shortLabel: 'BİM',
    title: 'BİM - Aktüel Ürünler',
    description: 'BİM aktüel ürünler — her gün yeni fırsatlar.',
    headerStyle: 'single-brand',
    tagline: 'Aktüel Ürünler',
    headerBg: '#ED1C24',
    headerText: '#ffffff',
    accent: '#C4000F',
  },
  sokmarket: {
    id: 'sokmarket',
    label: 'Şok Market',
    shortLabel: 'ŞOK',
    title: 'Cepte Şok - Uygun Fiyatlı Online Market',
    description: 'Şok Market ile online alışveriş — kampanyalı ürünler, hızlı teslimat.',
    headerStyle: 'single-brand',
    tagline: 'Cepte Şok',
    headerBg: '#FFD100',
    headerText: '#1a1a1a',
    accent: '#E30613',
  },
};

export function normalizeStoreMode(value: unknown): StoreMode {
  if (typeof value === 'string' && STORE_MODES.includes(value as StoreMode)) {
    return value as StoreMode;
  }
  return 'a101';
}

export function getStoreTheme(mode: unknown): StoreTheme {
  return STORE_THEMES[normalizeStoreMode(mode)];
}
