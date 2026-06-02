export type AppState =
  | { status: 'idle'; draftTask: string }
  | { status: 'flow'; task: string; startedAt: number; elapsedBeforePause: number }
  | { status: 'paused'; task: string; elapsedAtPause: number }
  | { status: 'break'; task: string; flowDuration: number; breakEndsAt: number };

export type AppEvent =
  | { type: 'SET_DRAFT'; text: string }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH' }
  | { type: 'SKIP_BREAK' }
  | { type: 'BREAK_DONE' }
  | { type: 'TICK' }
  | { type: 'RESTORE'; session: PersistedSession };

export interface PersistedSession {
  version: 1;
  status: 'flow' | 'paused';
  task: string;
  startedAt: number;
  elapsedBeforePause: number;
}
