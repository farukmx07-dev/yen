'use client';

import { useState } from 'react';
import { convertImgbbUrl, getProductImageSrc } from '@/lib/imageUtils';
import { PRODUCT_PLACEHOLDER } from '@/lib/publicAssets';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
}

function ImageFallback({ fallback }: { fallback?: React.ReactNode }) {
  if (fallback) return <>{fallback}</>;
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <span className="text-3xl opacity-60">📦</span>
    </div>
  );
}

export default function ProductImage({
  src,
  alt,
  className = '',
  fallback,
  priority = false,
}: ProductImageProps) {
  const imageSrc = getProductImageSrc(src);
  const [failed, setFailed] = useState(false);

  if (!imageSrc || failed) {
    return <ImageFallback fallback={fallback} />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      draggable={false}
      onError={(e) => {
        const target = e.currentTarget;
        const original = src?.trim() || '';

        if (original.includes('ibb.co/') || original.includes('imgbb.com/')) {
          const altUrl = convertImgbbUrl(
            original.replace('ibb.co/', 'i.ibb.co/').replace('imgbb.com/', 'i.imgbb.com/')
          );
          if (altUrl !== target.src) {
            target.src = altUrl;
            return;
          }
        }

        if (target.src !== PRODUCT_PLACEHOLDER) {
          target.src = PRODUCT_PLACEHOLDER;
          return;
        }

        setFailed(true);
      }}
    />
  );
}
