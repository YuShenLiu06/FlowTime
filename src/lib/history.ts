import type { TaskRecord } from '../types';

const HISTORY_KEY = 'flowtime.history';

export function appendHistory(record: TaskRecord): void {
  const history = getAllHistory();
  if (history.some((r) => r.id === record.id)) return;
  history.unshift(record);
  pruneHistory(history, 1000);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function getAllHistory(): TaskRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getTaskById(id: string): TaskRecord | null {
  return getAllHistory().find(r => r.id === id) ?? null;
}

export function updateHistory(id: string, updates: Partial<Omit<TaskRecord, 'id'>>): void {
  const history = getAllHistory();
  const index = history.findIndex((r) => r.id === id);
  if (index === -1) return;
  history[index] = { ...history[index], ...updates };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function pruneHistory(history: TaskRecord[], maxRecords: number): void {
  if (history.length > maxRecords) {
    history.splice(maxRecords);
  }
}
