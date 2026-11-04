import connectDB from '@/lib/mongodb';
import { settingsDb } from '@/lib/db';
import { resolveTiktokPixelId } from '@/lib/tiktokPixel';
import { getStoreTheme, normalizeStoreMode, type StoreMode, type StoreTheme } from '@/lib/storeThemes';

export interface StorefrontBootstrap {
  storeMode: StoreMode;
  theme: StoreTheme;
  pixelCode: string;
  tiktokPixelId: string;
}

const DEFAULT: StorefrontBootstrap = {
  storeMode: 'a101',
  theme: getStoreTheme('a101'),
  pixelCode: '',
  tiktokPixelId: '',
};

export async function getStorefrontBootstrap(): Promise<StorefrontBootstrap> {
  try {
    await connectDB();
    const settings = await settingsDb.get();
    const storeMode = normalizeStoreMode(settings.storeMode);
    return {
      storeMode,
      theme: getStoreTheme(storeMode),
      pixelCode: settings.pixelCode?.trim() || '',
      tiktokPixelId: resolveTiktokPixelId(settings),
    };
  } catch {
    return DEFAULT;
  }
}

export function themeCssVars(theme: StoreTheme): Record<string, string> {
  return {
    '--brand-primary': theme.headerBg,
    '--brand-accent': theme.accent,
    '--brand-header-text': theme.headerText,
  };
}
