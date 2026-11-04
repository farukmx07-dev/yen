import type { StoreMode } from '@/lib/storeThemes';

export interface StoreCampaignStyle {
  gradient: string;
  shadow: string;
  className: string;
  timerBox: string;
  timerValue: string;
  timerLabel: string;
  timerColon: string;
}

const CAMPAIGN_STYLES: Record<StoreMode, StoreCampaignStyle> = {
  a101: {
    gradient: 'from-[#0d9488] via-[#14b8a6] to-[#2dd4bf]',
    shadow: 'shadow-[0_12px_40px_rgba(13,148,136,0.35)]',
    className: 'a101-campaign-banner',
    timerBox:
      'campaign-timer-box border-none bg-white shadow-[0_6px_18px_rgba(15,118,110,0.22)] ring-1 ring-white/60',
    timerValue: 'campaign-timer-value text-[#0f766e]',
    timerLabel: 'text-white/90',
    timerColon: 'text-white',
  },
  carrefoursa: {
    gradient: 'from-[#003d7a] via-[#004E97] to-[#0066cc]',
    shadow: 'shadow-[0_12px_40px_rgba(0,78,151,0.35)]',
    className: 'csa-campaign-banner',
    timerBox:
      'campaign-timer-box border-none bg-white shadow-[0_6px_18px_rgba(0,78,151,0.22)] ring-1 ring-white/50',
    timerValue: 'campaign-timer-value text-[#004E97]',
    timerLabel: 'text-white/90',
    timerColon: 'text-white',
  },
  bim: {
    gradient: 'from-[#C4000F] via-[#ED1C24] to-[#ff3b44]',
    shadow: 'shadow-[0_12px_40px_rgba(237,28,36,0.35)]',
    className: 'bim-campaign-banner',
    timerBox:
      'campaign-timer-box border-none bg-white shadow-[0_6px_18px_rgba(237,28,36,0.22)] ring-1 ring-white/50',
    timerValue: 'campaign-timer-value text-[#ED1C24]',
    timerLabel: 'text-white/90',
    timerColon: 'text-white',
  },
  sokmarket: {
    gradient: 'from-[#E30613] via-[#ff1a2e] to-[#FFD100]',
    shadow: 'shadow-[0_12px_40px_rgba(227,6,19,0.28)]',
    className: 'sok-campaign-banner',
    timerBox:
      'campaign-timer-box border-none bg-[#FFD100] shadow-[0_6px_18px_rgba(227,6,19,0.2)] ring-1 ring-white/40',
    timerValue: 'campaign-timer-value text-[#E30613]',
    timerLabel: 'text-white/95',
    timerColon: 'text-white',
  },
};

export function getStoreCampaignStyle(storeMode: StoreMode): StoreCampaignStyle {
  return CAMPAIGN_STYLES[storeMode] ?? CAMPAIGN_STYLES.a101;
}

export function getStoreAlertBarStyle(storeMode: StoreMode): string {
  switch (storeMode) {
    case 'carrefoursa':
      return 'border-[#004E97] bg-gradient-to-r from-[#003d7a] via-[#004E97] to-[#0066cc]';
    case 'bim':
      return 'border-[#ED1C24] bg-gradient-to-r from-[#C4000F] via-[#ED1C24] to-[#ff3b44]';
    case 'sokmarket':
      return 'border-[#FFD100] bg-gradient-to-r from-[#E30613] via-[#ff1a2e] to-[#FFD100]';
    default:
      return 'border-[#14b8a6] bg-gradient-to-r from-[#0d9488] via-[#14b8a6] to-[#2dd4bf]';
  }
}

export function getStoreAlertTimerStyle(storeMode: StoreMode): string {
  switch (storeMode) {
    case 'carrefoursa':
      return 'bg-white text-[#004E97]';
    case 'bim':
      return 'bg-white text-[#ED1C24]';
    case 'sokmarket':
      return 'bg-[#FFD100] text-[#E30613]';
    default:
      return 'bg-white text-[#0f766e]';
  }
}
