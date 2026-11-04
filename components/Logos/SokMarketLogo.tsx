import Image from 'next/image';
import { SOKMARKET_ASSETS } from '@/lib/storeAssets';

interface SokMarketLogoProps {
  className?: string;
}

export default function SokMarketLogo({ className = '' }: SokMarketLogoProps) {
  return (
    <Image
      src={SOKMARKET_ASSETS.logo}
      alt="Cepte Şok"
      width={168}
      height={56}
      priority
      unoptimized
      sizes="(max-width: 480px) 120px, 168px"
      className={`block h-[clamp(2.25rem,7vw,3.25rem)] w-auto max-w-[clamp(6.5rem,38vw,10.5rem)] object-contain object-left ${className}`}
    />
  );
}
