export interface ProductImageSource {
  image?: string;
  images?: string[];
}

export function normalizeProductImages(input: ProductImageSource): {
  image: string;
  images: string[];
} {
  const fromImages = (input.images ?? []).map((item) => item.trim()).filter(Boolean);
  const fromSingle = input.image?.trim() ? [input.image.trim()] : [];
  const images = fromImages.length > 0 ? fromImages : fromSingle;

  return {
    images,
    image: images[0] || '',
  };
}

export function getProductImages(product: ProductImageSource): string[] {
  return normalizeProductImages(product).images;
}

export function getPrimaryProductImage(product: ProductImageSource): string {
  return normalizeProductImages(product).image;
}
