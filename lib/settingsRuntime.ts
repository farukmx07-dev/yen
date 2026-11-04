import type { PublicSettingsSnapshot } from '@/lib/publicSettings';

const SETTINGS_EVENT = 'app:settings-update';

export function emitSettingsUpdate(settings: PublicSettingsSnapshot) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));
}

export function onSettingsUpdate(handler: (settings: PublicSettingsSnapshot) => void) {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<PublicSettingsSnapshot>).detail;
    if (detail && typeof detail === 'object') {
      handler(detail);
    }
  };

  window.addEventListener(SETTINGS_EVENT, listener);
  return () => window.removeEventListener(SETTINGS_EVENT, listener);
}
