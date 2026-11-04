// Image URL utilities

/**
 * Converts imgbb.com page URLs to direct image URLs
 * imgbb.com page URLs (like https://ibb.co/MDyWjj6b) need to be converted to direct image URLs
 * 
 * Note: imgbb.com page URLs redirect to the actual image, but we need the direct URL.
 * The best approach is to use the direct image URL from imgbb.com (i.ibb.co format).
 */
export function convertImgbbUrl(url: string): string {
  if (!url) return url;
  
  // If it's already a direct image URL, return as is
  if (url.includes('i.ibb.co') || url.includes('i.imgbb.com')) {
    return url;
  }
  
  // If it's an imgbb.com page URL (https://ibb.co/xxxxx), convert to direct image URL
  // imgbb.com page URLs format: https://ibb.co/xxxxx
  // Direct image URLs format: https://i.ibb.co/xxxxx/filename.ext
  // We'll try to convert by adding 'i.' prefix and common extensions
  if (url.includes('ibb.co/') && !url.includes('i.ibb.co')) {
    // Extract the path from the URL (e.g., "MDyWjj6b" from "https://ibb.co/MDyWjj6b")
    const match = url.match(/ibb\.co\/([^\/\?\s]+)/);
    if (match && match[1]) {
      const path = match[1];
      // imgbb.com usually serves images with the same path as filename
      // Try common extensions - the browser will try to load them
      // Most common: .jpg, .png
      return `https://i.ibb.co/${path}/${path}.jpg`;
    }
  }
  
  // If it's an imgbb.com page URL (https://imgbb.com/xxxxx)
  if (url.includes('imgbb.com/') && !url.includes('i.imgbb.com')) {
    const match = url.match(/imgbb\.com\/([^\/\?\s]+)/);
    if (match && match[1]) {
      const path = match[1];
      return `https://i.imgbb.com/${path}.jpg`;
    }
  }
  
  // Return original URL if we can't convert it
  return url;
}

import { resolveProductImagePath } from '@/lib/publicAssets';

export function getProductImageSrc(image?: string | null): string | null {
  if (!image?.trim()) return null;

  const value = image.trim();
  if (value.startsWith('data:image')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return convertImgbbUrl(value);
  }

  return resolveProductImagePath(value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`);
}

/**
 * Gets the direct image URL from imgbb.com page URL
 * This function tries to fetch the page and extract the direct image URL
 */
export async function getImgbbDirectUrl(pageUrl: string): Promise<string> {
  try {
    // For now, just return the converted URL
    // In a real implementation, you might want to fetch the page and parse the HTML
    // to get the actual direct image URL
    return convertImgbbUrl(pageUrl);
  } catch (error) {
    console.error('Error converting imgbb URL:', error);
    return pageUrl;
  }
}

/**
 * Checks if a URL is an imgbb.com page URL (not a direct image URL)
 */
export function isImgbbPageUrl(url: string): boolean {
  if (!url) return false;
  return (url.includes('ibb.co/') || url.includes('imgbb.com/')) && 
         !url.includes('i.ibb.co') && 
         !url.includes('i.imgbb.com');
}

