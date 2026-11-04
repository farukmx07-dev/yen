export const ADMIN_STORAGE_KEY = 'admin';

export interface AdminSession {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  loggedIn?: boolean;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AdminSession;
    if (parsed.role === 'admin' || parsed.role === 'superadmin') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setAdminSession(user: AdminSession) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({ ...user, loggedIn: true }));
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

export function isSuperAdmin(session: AdminSession | null = getAdminSession()): boolean {
  return session?.role === 'superadmin';
}

export function getAdminAuthHeaders(): Record<string, string> {
  const session = getAdminSession();
  if (!session) return {};
  return {
    'x-admin-id': session.id,
    'x-admin-role': session.role,
  };
}

export async function adminApiFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  for (const [key, value] of Object.entries(getAdminAuthHeaders())) {
    headers.set(key, value);
  }
  return fetch(url, { ...init, headers, cache: 'no-store' });
}
