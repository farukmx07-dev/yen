import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function A101Logo({ className = "w-24 h-8" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <Image
        src={BRAND_ASSETS.a101.logo}
        alt="A-101 Logo"
        width={96}
        height={32}
        className="object-contain"
        priority
      />
    </div>
  );
}

