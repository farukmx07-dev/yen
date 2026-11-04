'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { STOREFRONT_SETTINGS_POLL_MS } from '@/lib/constants';
import type { PublicSettingsSnapshot } from '@/lib/publicSettings';
import { onSettingsUpdate } from '@/lib/settingsRuntime';
import {
  getStoreTheme,
  normalizeStoreMode,
  type StoreMode,
  type StoreTheme,
} from '@/lib/storeThemes';
import { getStoreCopy, type StoreCopy } from '@/lib/storeCopy';

interface StoreThemeContextValue {
  storeMode: StoreMode;
  theme: StoreTheme;
  copy: StoreCopy;
}

interface StoreThemeProviderProps {
  children: React.ReactNode;
  initialStoreMode?: StoreMode;
}

const StoreThemeContext = createContext<StoreThemeContextValue>({
  storeMode: 'a101',
  theme: getStoreTheme('a101'),
  copy: getStoreCopy('a101'),
});

export function useStoreTheme() {
  return useContext(StoreThemeContext);
}

function applyThemeToDocument(theme: StoreTheme) {
  const root = document.documentElement;
  root.dataset.store = theme.id;
  root.style.setProperty('--brand-primary', theme.headerBg);
  root.style.setProperty('--brand-accent', theme.accent);
  root.style.setProperty('--brand-header-text', theme.headerText);

  if (typeof document !== 'undefined') {
    document.title = theme.title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', theme.description);
    }
  }
}

function resolveStoreModeFromSnapshot(
  snapshot: PublicSettingsSnapshot | undefined,
  fallback: StoreMode
): StoreMode {
  if (snapshot?.storeMode) {
    return normalizeStoreMode(snapshot.storeMode);
  }
  return fallback;
}

export default function StoreThemeProvider({
  children,
  initialStoreMode = 'a101',
}: StoreThemeProviderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [storeMode, setStoreMode] = useState<StoreMode>(() => normalizeStoreMode(initialStoreMode));

  const theme = useMemo(() => getStoreTheme(storeMode), [storeMode]);
  const copy = useMemo(() => getStoreCopy(storeMode), [storeMode]);

  useEffect(() => {
    if (isAdmin) return;

    const applySnapshot = (snapshot: PublicSettingsSnapshot) => {
      setStoreMode((prev) => resolveStoreModeFromSnapshot(snapshot, prev));
    };

    const load = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          applySnapshot(data.data);
        }
      } catch {
        /* sunucudan gelen initialStoreMode korunur */
      }
    };

    void load();
    const interval = setInterval(load, STOREFRONT_SETTINGS_POLL_MS);
    const unsubscribe = onSettingsUpdate(applySnapshot);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    applyThemeToDocument(theme);
  }, [isAdmin, theme]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <StoreThemeContext.Provider value={{ storeMode, theme, copy }}>
      {children}
    </StoreThemeContext.Provider>
  );
}
