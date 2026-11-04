import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function A101KapidaLogo({ className = "w-36 h-10" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <Image
        src={BRAND_ASSETS.a101.kapida}
        alt="A-101 KAPIDA Logo"
        width={144}
        height={40}
        className="object-contain"
        priority
      />
    </div>
  );
}

