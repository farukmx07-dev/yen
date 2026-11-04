import type { ComponentType } from 'react';

export interface BankLogoProps {
  className?: string;
  height?: number;
}

export type BankLogoVariant = 'full' | 'wordmark' | 'maximum' | 'maximum-header';

const BANK_LOGO_SRC: Record<string, string> = {
  garanti: '/banks/garanti.png',
  yapikredi: '/banks/yapikredi.png',
  akbank: '/banks/akbank.png',
  vakifbank: '/banks/vakifbank.png',
  isbank: '/banks/isbank.png',
  ziraat: '/banks/ziraat.png',
  halkbank: '/banks/halkbank.png',
  teb: '/banks/teb.png',
  qnb: '/banks/qnb.png',
  denizbank: '/banks/denizbank.png',
  ing: '/banks/ing.png',
  sekerbank: '/banks/sekerbank.png',
  hsbc: '/banks/hsbc.png',
  albaraka: '/banks/albaraka.png',
  kuveytturk: '/banks/kuveytturk.png',
  turkiyefinans: '/banks/turkiyefinans.png',
};

const BANK_LOGO_ALT: Record<string, string> = {
  garanti: 'Garanti BBVA',
  yapikredi: 'Yapı Kredi',
  akbank: 'Akbank',
  vakifbank: 'VakıfBank',
  isbank: 'Türkiye İş Bankası',
  ziraat: 'Ziraat Bankası',
  halkbank: 'Halkbank',
  teb: 'TEB',
  qnb: 'QNB Finansbank',
  denizbank: 'DenizBank',
  ing: 'ING',
  sekerbank: 'Şekerbank',
  hsbc: 'HSBC',
  albaraka: 'Albaraka Türk',
  kuveytturk: 'Kuveyt Türk',
  turkiyefinans: 'Türkiye Finans',
};

const BANK_COLORS: Record<string, string> = {
  sekerbank: '#007A33',
  hsbc: '#DB0011',
  citibank: '#003B70',
  albaraka: '#E85D04',
  kuveytturk: '#006B6B',
  turkiyefinans: '#00A0AF',
  anadolubank: '#0054A6',
  fortis: '#0054A6',
  generic: '#5BC0C0',
};

function TebLogo({ className, height = 44 }: BankLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/banks/teb.png"
      alt="TEB"
      className={`block w-auto max-w-none object-contain object-left-top ${className ?? ''}`}
      style={{ height, minHeight: height }}
      loading="lazy"
      decoding="async"
    />
  );
}

function VakifbankLogo({ className, height = 32 }: BankLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/banks/vakifbank.png"
      alt="VakıfBank"
      className={`block w-auto max-w-[180px] object-contain object-left ${className ?? ''}`}
      style={{ height }}
      loading="lazy"
      decoding="async"
    />
  );
}

function HsbcLogo({ className, height = 44 }: BankLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/banks/hsbc.png"
      alt="HSBC"
      className={`block w-auto max-w-[200px] object-contain object-left ${className ?? ''}`}
      style={{ height }}
      loading="lazy"
      decoding="async"
    />
  );
}

function AlbarakaLogo({ className, height = 44 }: BankLogoProps) {
  const zoom = 2.35;
  const viewWidth = height * 3.4;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className ?? ''}`}
      style={{ height, width: viewWidth }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banks/albaraka.png"
        alt="Albaraka Türk"
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{ height: height * zoom }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function MaximumLogo({ className, height = 52, tone = 'brand' }: BankLogoProps & { tone?: 'brand' | 'header' }) {
  const isHeader = tone === 'header';
  const displayHeight = isHeader ? (height ?? 88) : height;

  if (isHeader) {
    const scale = 3.2;

    return (
      <div
        className={`flex w-full items-center justify-center overflow-hidden ${className ?? ''}`}
        style={{ height: displayHeight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banks/maximum.png"
          alt="maximum"
          className="max-w-none shrink-0 object-contain"
          style={{
            height: displayHeight * scale,
            width: 'auto',
            filter: 'brightness(0) invert(1)',
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/banks/maximum.png"
      alt="maximum"
      className={`block w-auto object-contain object-center ${className ?? ''}`}
      style={{
        height: displayHeight,
        maxWidth: '280px',
        filter:
          'brightness(0) saturate(100%) invert(14%) sepia(98%) saturate(7046%) hue-rotate(310deg) brightness(95%) contrast(101%)',
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

const BANK_LOGO_HEIGHT: Partial<Record<string, number>> = {
  akbank: 42,
  teb: 44,
  vakifbank: 32,
  hsbc: 44,
};

function BankImageLogo({
  src,
  alt,
  className,
  height = 28,
  bankId,
}: BankLogoProps & { src: string; alt: string; bankId?: string }) {
  const displayHeight = bankId && BANK_LOGO_HEIGHT[bankId] ? BANK_LOGO_HEIGHT[bankId]! : height;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`block w-auto max-w-[160px] object-contain object-left ${className ?? ''}`}
      style={{ height: displayHeight }}
      loading="lazy"
      decoding="async"
    />
  );
}

function createImageLogo(bankId: string): ComponentType<BankLogoProps> {
  const src = BANK_LOGO_SRC[bankId];
  const alt = BANK_LOGO_ALT[bankId] ?? bankId;

  return function BankLogoImage(props: BankLogoProps) {
    return <BankImageLogo {...props} src={src} alt={alt} bankId={bankId} />;
  };
}

const LOGO_MAP: Record<string, ComponentType<BankLogoProps>> = {
  ...Object.fromEntries(
    Object.keys(BANK_LOGO_SRC)
      .filter((bankId) => bankId !== 'vakifbank' && bankId !== 'hsbc' && bankId !== 'albaraka' && bankId !== 'teb')
      .map((bankId) => [bankId, createImageLogo(bankId)])
  ),
  teb: TebLogo,
  vakifbank: VakifbankLogo,
  hsbc: HsbcLogo,
  albaraka: AlbarakaLogo,
};

export function GenericBankLogo({
  className,
  height = 28,
  label,
  color = '#374151',
}: BankLogoProps & { label: string; color?: string }) {
  const short = label.slice(0, 3).toUpperCase();
  return (
    <svg
      className={className}
      height={height}
      viewBox="0 0 140 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
    >
      <circle cx="14" cy="16" r="12" fill={color} />
      <text
        x="14"
        y="20"
        textAnchor="middle"
        fill="#fff"
        fontSize="9"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        {short}
      </text>
      <text x="30" y="20" fill={color} fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">
        {label}
      </text>
    </svg>
  );
}

export function getBankLogoColor(bankId: string): string {
  return BANK_COLORS[bankId] ?? '#374151';
}

export function resolveBankLogoComponent(
  bankId: string,
  variant: BankLogoVariant = 'full'
): ComponentType<BankLogoProps> | null {
  if ((variant === 'maximum' || variant === 'maximum-header') && bankId === 'isbank') {
    const tone = variant === 'maximum-header' ? 'header' : 'brand';
    return function MaximumLogoWrapper(props: BankLogoProps) {
      return <MaximumLogo {...props} tone={tone} />;
    };
  }
  return LOGO_MAP[bankId] ?? null;
}

export function getBankLogoSrc(bankId: string): string | undefined {
  return BANK_LOGO_SRC[bankId];
}
