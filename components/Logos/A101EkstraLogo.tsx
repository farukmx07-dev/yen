import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function A101EkstraLogo({ className = "w-32 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <Image
        src={BRAND_ASSETS.a101.ekstra}
        alt="A-101 EKSTRA Logo"
        width={128}
        height={40}
        className="object-contain"
        priority
      />
    </div>
  );
}

