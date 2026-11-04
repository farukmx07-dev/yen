import Image from 'next/image';
import { BIM_ASSETS } from '@/lib/storeAssets';

interface BimLogoProps {
  className?: string;
}

export default function BimLogo({ className = '' }: BimLogoProps) {
  return (
    <Image
      src={BIM_ASSETS.logo}
      alt="BİM"
      width={120}
      height={48}
      priority
      unoptimized
      sizes="(max-width: 480px) 90px, 120px"
      className={`block h-[clamp(1.75rem,5vw,2.75rem)] w-auto max-w-[clamp(4.5rem,28vw,7.5rem)] object-contain object-left ${className}`}
    />
  );
}
