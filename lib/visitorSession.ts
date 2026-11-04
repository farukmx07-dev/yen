import { generateUuid } from './uuid';

const SESSION_KEY = 'visitorSessionId';
const LOG_ID_KEY = 'visitorLogId';

let memorySessionId: string | null = null;
let memoryLogId: string | null = null;

export function getVisitorSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    memorySessionId = id;
    return id;
  } catch {
    if (!memorySessionId) {
      memorySessionId = generateUuid();
    }
    return memorySessionId;
  }
}

export function getVisitorLogId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(LOG_ID_KEY) || memoryLogId;
  } catch {
    return memoryLogId;
  }
}

export function setVisitorLogId(id: string) {
  if (typeof window === 'undefined') return;
  memoryLogId = id;
  try {
    sessionStorage.setItem(LOG_ID_KEY, id);
    sessionStorage.setItem('currentLogId', id);
  } catch {
    /* memory-only fallback */
  }
}

export function clearVisitorLogId() {
  memoryLogId = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LOG_ID_KEY);
    sessionStorage.removeItem('currentLogId');
  } catch {
    /* ignore */
  }
}
