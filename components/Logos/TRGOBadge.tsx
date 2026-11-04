import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function TRGOBadge({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={BRAND_ASSETS.badges.trGo}
        alt="TR GO Badge"
        width={64}
        height={64}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

