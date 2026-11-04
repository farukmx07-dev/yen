'use client';

import Link from 'next/link';
import { formatCampaignDateTr, getCampaignStatus } from '@/lib/campaignUtils';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import { getStoreCampaignStyle, type StoreCampaignStyle } from '@/lib/storeCampaignStyles';

interface CampaignCountdownBannerProps {
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  timeLeft: { hours: number; minutes: number; seconds: number };
  ctaHref?: string;
}

function TimerUnit({
  value,
  label,
  style,
}: {
  value: string;
  label: string;
  style: StoreCampaignStyle;
}) {
  return (
    <div className="flex min-w-[clamp(3.5rem,18vw,5.5rem)] flex-col items-center">
      <div
        className={`relative w-full overflow-hidden rounded-xl px-2 py-2 sm:px-4 sm:py-3 ${style.timerBox}`}
      >
        <span
          className={`relative block text-center font-black tabular-nums tracking-tight text-fluid-2xl sm:text-fluid-3xl ${style.timerValue}`}
        >
          {value}
        </span>
      </div>
      <span
        className={`mt-1.5 text-fluid-xs font-bold uppercase tracking-[0.12em] ${style.timerLabel}`}
      >
        {label}
      </span>
    </div>
  );
}

function TimerColon({ className }: { className: string }) {
  return (
    <span
      className={`mb-5 self-start px-0.5 text-xl font-black sm:text-2xl md:text-3xl ${className}`}
    >
      :
    </span>
  );
}

export default function CampaignCountdownBanner({
  campaignStartDate,
  campaignEndDate,
  timeLeft,
  ctaHref = '/products?firsat=1',
}: CampaignCountdownBannerProps) {
  const { copy, storeMode } = useStoreTheme();
  const campaignStyle = getStoreCampaignStyle(storeMode);
  const campaignStatus = getCampaignStatus(campaignStartDate, campaignEndDate);
  const ended = campaignStatus === 'ended';

  const subtitle = campaignEndDate
    ? `Kampanya bitiş: ${formatCampaignDateTr(campaignEndDate)}`
    : 'Bu fiyatlar gece yarısında bitiyor';

  return (
    <section className="px-[var(--container-padding)] pt-2 sm:pt-3 md:pt-4">
      <div
        className={`relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br ${campaignStyle.gradient} ${campaignStyle.className} px-4 py-4 text-white ${campaignStyle.shadow} sm:px-6 sm:py-5 md:px-8 md:py-6`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm sm:text-xs">
              {copy.campaignBannerBadge}
            </span>
            {!ended && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/95 sm:text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                Canlı
              </span>
            )}
          </div>

          <div className="mb-4 md:mb-5">
            <h2 className="text-fluid-xl font-black leading-tight sm:text-fluid-2xl">
              {copy.campaignBannerTitle}
            </h2>
            <p className="mt-1 text-fluid-xs text-white/85 sm:text-fluid-sm">{subtitle}</p>
            <div className="mt-3 h-px w-12 bg-white/35" />
          </div>

          {ended ? (
            <div className="mb-4 rounded-xl border border-white/20 bg-black/15 px-4 py-3 text-center text-sm font-bold text-red-100 sm:text-base">
              Kampanya sona erdi
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-center gap-1.5 sm:gap-2 md:justify-start md:gap-3">
              <TimerUnit value={String(timeLeft.hours).padStart(2, '0')} label="Saat" style={campaignStyle} />
              <TimerColon className={campaignStyle.timerColon} />
              <TimerUnit value={String(timeLeft.minutes).padStart(2, '0')} label="Dakika" style={campaignStyle} />
              <TimerColon className={campaignStyle.timerColon} />
              <TimerUnit value={String(timeLeft.seconds).padStart(2, '0')} label="Saniye" style={campaignStyle} />
            </div>
          )}

          <Link
            href={ctaHref}
            className="flex w-full min-h-[var(--touch-target)] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-fluid-sm font-black text-white backdrop-blur-sm transition touch-manipulation hover:bg-white/25 active:scale-[0.99] sm:text-fluid-base"
          >
            Tüm Fırsatları Gör
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
