import type { PersistedSession } from '../types';

const STORAGE_KEY = 'flowtime.session';

interface PersistedSessionV1 {
  version: 1;
  status: 'flow' | 'paused';
  task: string;
  startedAt: number;
  elapsedBeforePause: number;
}

function migrateV1ToV2(session: PersistedSessionV1): PersistedSession {
  return {
    version: 2,
    status: session.status,
    task: session.task,
    startedAt: session.startedAt,
    elapsedBeforePause: session.elapsedBeforePause,
    totalPausedSec: 0,
    pausedAt: session.status === 'paused' ? Date.now() : undefined
  };
}

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
    if (session.version === 1) {
      return migrateV1ToV2(session as PersistedSessionV1);
    }
    if (session.version !== 2) return null;
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
