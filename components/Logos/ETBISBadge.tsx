import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function ETBISBadge({ className = "w-16 h-20" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={BRAND_ASSETS.badges.etbis}
        alt="ETBİS Badge"
        width={64}
        height={80}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

