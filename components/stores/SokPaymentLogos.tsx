import Image from 'next/image';
import { BRAND_ASSETS, PAYMENT_ASSETS } from '@/lib/publicAssets';

export default function SokPaymentLogos() {
  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
      <div className="flex shrink-0 items-center">
        <span className="h-5 w-5 rounded-full bg-[#eb001b]" aria-hidden />
        <span className="-ml-2 h-5 w-5 rounded-full bg-[#f79e1b]" aria-hidden />
        <span className="sr-only">Mastercard</span>
      </div>
      <div className="flex shrink-0 items-center">
        <span className="h-5 w-5 rounded-full bg-[#0066b2]" aria-hidden />
        <span className="-ml-2 h-5 w-5 rounded-full bg-[#eb001b]" aria-hidden />
        <span className="sr-only">Maestro</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/banks/visa.png" alt="Visa" className="h-4 w-auto object-contain sm:h-5" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/banks/troy.png" alt="Troy" className="h-4 w-auto object-contain sm:h-5" />
      <div className="inline-flex shrink-0 overflow-hidden rounded-full bg-black px-1 py-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PAYMENT_ASSETS.bkmGo} alt="BKM Express" className="h-4 w-auto object-contain" />
      </div>
      <Image
        src={BRAND_ASSETS.badges.etbis}
        alt="ETBİS"
        width={32}
        height={32}
        className="h-7 w-7 object-contain sm:h-8 sm:w-8"
      />
      <Image
        src={BRAND_ASSETS.badges.trGo}
        alt="TR GO"
        width={48}
        height={24}
        className="h-5 w-auto object-contain sm:h-6"
      />
    </div>
  );
}
