import Image from 'next/image';
import { BRAND_ASSETS } from '@/lib/publicAssets';

export default function QRCode({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={BRAND_ASSETS.a101.qrIcon}
        alt="A-101 QR Code"
        width={64}
        height={64}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

