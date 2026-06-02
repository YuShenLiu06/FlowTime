import type { PersistedSession } from '../types';

const STORAGE_KEY = 'flowtime.session';

export function saveSession(session: PersistedSession): void {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Silently handle storage errors
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const session = JSON.parse(serialized);
    if (session.version !== 1) return null;
    return session as PersistedSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently handle storage errors
  }
}
