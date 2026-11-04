'use client';

import { useEffect, useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { computeTimeLeft, formatCampaignDateTr, getCampaignStatus } from '@/lib/campaignUtils';
import { useStoreTheme } from '@/components/StoreThemeProvider';
import { getStoreAlertBarStyle, getStoreAlertTimerStyle } from '@/lib/storeCampaignStyles';

interface CampaignAlertBarProps {
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  timeLeft: { hours: number; minutes: number; seconds: number };
}

export default function CampaignAlertBar({
  campaignStartDate,
  campaignEndDate,
  timeLeft,
}: CampaignAlertBarProps) {
  const { copy, storeMode } = useStoreTheme();
  const campaignStatus = getCampaignStatus(campaignStartDate, campaignEndDate);
  const barStyle = getStoreAlertBarStyle(storeMode);
  const timerStyle = getStoreAlertTimerStyle(storeMode);

  return (
    <div className={`sticky top-0 z-40 border-b-2 text-white shadow-lg ${barStyle}`}>
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 sm:items-center">
            <FiAlertCircle className="mt-0.5 shrink-0 sm:mt-0" size={22} />
            <div>
              <p className="text-sm font-black uppercase tracking-wide sm:text-base">
                {copy.campaignModalTitle}
              </p>
              <p className="text-[11px] opacity-95 sm:text-xs">
                {campaignEndDate
                  ? `Bitiş: ${formatCampaignDateTr(campaignEndDate)}`
                  : 'Online özel fırsat ürünleri — kaçırmayın!'}
              </p>
            </div>
          </div>

          {campaignStatus === 'ended' ? (
            <span className="rounded-lg bg-black/25 px-3 py-1.5 text-xs font-bold">Kampanya sona erdi</span>
          ) : (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-black shadow-sm sm:text-xl ${timerStyle}`}>
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="opacity-70">:</span>
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="opacity-70">:</span>
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useCampaignTimer(campaignEndDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => setTimeLeft(computeTimeLeft(campaignEndDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [campaignEndDate]);

  return timeLeft;
}
