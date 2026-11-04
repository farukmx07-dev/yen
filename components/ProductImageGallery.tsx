'use client';

import { useState } from 'react';
import ProductImage from '@/components/ProductImage';
import { getProductImages } from '@/lib/productImages';

interface ProductImageGalleryProps {
  name: string;
  image?: string;
  images?: string[];
  overlay?: React.ReactNode;
}

export default function ProductImageGallery({ name, image, images, overlay }: ProductImageGalleryProps) {
  const galleryImages = getProductImages({ image, images });
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = galleryImages[activeIndex] || galleryImages[0] || '';

  if (galleryImages.length === 0) {
    return (
      <div className="relative aspect-square rounded-lg bg-white flex items-center justify-center">
        <span className="text-4xl sm:text-5xl md:text-6xl">📦</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white flex items-center justify-center p-4 sm:p-6 md:p-8">
        <ProductImage
          src={activeImage}
          alt={name}
          className="max-h-full max-w-full object-contain"
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl sm:text-5xl md:text-6xl">📦</span>
            </div>
          }
        />
        {overlay}
      </div>

      {galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {galleryImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 transition sm:h-20 sm:w-20 ${
                activeIndex === index
                  ? 'border-a101-teal ring-2 ring-a101-teal/30'
                  : 'border-gray-200 hover:border-a101-teal/50'
              }`}
              aria-label={`Görsel ${index + 1}`}
            >
              <ProductImage
                src={src}
                alt={`${name} ${index + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
