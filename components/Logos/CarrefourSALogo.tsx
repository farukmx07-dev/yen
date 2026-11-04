import Image from 'next/image';
import { CARREFOURSA_ASSETS } from '@/lib/storeAssets';

interface CarrefourSALogoProps {
  className?: string;
  inverted?: boolean;
}

export default function CarrefourSALogo({ className = '', inverted = false }: CarrefourSALogoProps) {
  return (
    <Image
      src={CARREFOURSA_ASSETS.logo}
      alt="CarrefourSA"
      width={220}
      height={48}
      priority
      unoptimized
      sizes="(max-width: 480px) 120px, (max-width: 768px) 160px, 220px"
      className={`block h-[clamp(1.5rem,4.5vw,2.5rem)] w-auto max-w-[clamp(5.5rem,28vw,13.75rem)] object-contain object-left ${
        inverted ? 'mix-blend-screen' : ''
      } ${className}`}
    />
  );
}
