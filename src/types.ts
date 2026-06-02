export interface TaskRecord {
  id: string;
  task: string;
  startedAt: number;
  finishedAt: number;
  flowDurationSec: number;
  pausedDurationSec: number;
  summary: string;
}

export interface UserPreferences {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export type AppState =
  | { status: 'idle'; draftTask: string }
  | { status: 'flow'; task: string; startedAt: number; elapsedBeforePause: number; totalPausedSec: number }
  | { status: 'paused'; task: string; startedAt: number; elapsedAtPause: number; totalPausedSec: number; pausedAt: number }
  | { status: 'break'; task: string; flowDuration: number; breakEndsAt: number; isPendingSummary: boolean; pendingRecord: TaskRecord };

export type AppEvent =
  | { type: 'SET_DRAFT'; text: string }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH' }
  | { type: 'SKIP_BREAK' }
  | { type: 'BREAK_DONE' }
  | { type: 'TICK' }
  | { type: 'RESTORE'; session: PersistedSession }
  | { type: 'SUBMIT_SUMMARY'; text: string }
  | { type: 'DISMISS_SUMMARY' }
  | { type: 'OPEN_SUMMARY' };

export interface PersistedSession {
  version: 2;
  status: 'flow' | 'paused';
  task: string;
  startedAt: number;
  elapsedBeforePause: number;
  totalPausedSec: number;
  pausedAt?: number;
}
