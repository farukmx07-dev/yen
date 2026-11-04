import { PAYMENT_ASSETS } from '@/lib/publicAssets';

interface BkmGoLogoProps {
  height?: number;
  className?: string;
}

export default function BkmGoLogo({ height = 28, className }: BkmGoLogoProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center overflow-hidden rounded-full bg-black px-1.5 py-0.5 ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PAYMENT_ASSETS.bkmGo}
        alt="GO Güvenli Öde"
        className="block w-auto object-contain"
        style={{ height }}
      />
    </div>
  );
}
