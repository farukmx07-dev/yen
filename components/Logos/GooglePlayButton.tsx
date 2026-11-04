import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function GooglePlayButton({ className = "w-24 h-8" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={BRAND_ASSETS.appStores.googlePlay}
        alt="Google Play Button"
        width={96}
        height={32}
        className="object-contain w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
      />
    </div>
  );
}

