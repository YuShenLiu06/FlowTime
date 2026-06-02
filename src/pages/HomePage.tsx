import { useEffect, useCallback } from 'react';
import { useTimerMachine } from '../hooks/useTimerMachine';
import { useRecovery } from '../hooks/useRecovery';
import { TaskInput } from '../components/TaskInput';
import { TimerDisplay } from '../components/TimerDisplay';
import { Controls } from '../components/Controls';
import { BreakPanel } from '../components/BreakPanel';
import { SummaryDialog } from '../components/SummaryDialog';
import { PausedTimer } from '../components/PausedTimer';
import { AppNav } from '../components/AppNav';
import type { AppState } from '../types';

function bgClass(state: AppState): string {
  switch (state.status) {
    case 'idle': return 'bg-stone-100';
    case 'flow':
    case 'paused': return 'bg-flow-bg noise-bg';
    case 'break': return 'bg-break-bg noise-bg';
  }
}

export function HomePage() {
  const { state, dispatch, elapsed, pausedFor } = useTimerMachine();
  useRecovery(dispatch);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === ' ') {
      e.preventDefault();
      if (state.status === 'flow') dispatch({ type: 'PAUSE' });
      else if (state.status === 'paused') dispatch({ type: 'RESUME' });
    } else if (e.key === 'Enter') {
      if (state.status === 'flow' || state.status === 'paused') {
        dispatch({ type: 'FINISH' });
      }
    }
  }, [state.status, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const showTask = state.status === 'flow' || state.status === 'paused';

  return (
    <div className={`min-h-dvh flex flex-col transition-colors duration-1000 ${bgClass(state)}`}>
      <AppNav showHistoryLink={state.status === 'idle' || state.status === 'break'} variant={state.status === 'idle' ? 'light' : 'dark'} />

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        {showTask && (
          <div className="animate-fade-in text-center flex flex-col items-center gap-2">
            <span
              className="font-mono text-lg text-flow-muted/60 tracking-wide select-none max-w-[85vw] truncate inline-block"
              title={state.task}
            >
              {state.task}
            </span>
            {state.status === 'paused' && <PausedTimer pausedFor={pausedFor} />}
          </div>
        )}

        <div className="flex flex-col items-center">
          {state.status === 'break' && <BreakPanel state={state} />}
          <TimerDisplay state={state} elapsed={elapsed} />
        </div>
      </main>

      <footer className="pb-8 pt-4 flex justify-center">
        {state.status === 'idle' ? (
          <div className="flex flex-col items-center gap-14">
            <TaskInput state={state as Extract<AppState, { status: 'idle' }>} dispatch={dispatch} />
            <Controls state={state} dispatch={dispatch} />
          </div>
        ) : (
          <Controls state={state} dispatch={dispatch} />
        )}
      </footer>

      {state.status === 'break' && (
        <SummaryDialog
          record={state.pendingRecord}
          isOpen={state.isPendingSummary}
          onSubmit={(text) => dispatch({ type: 'SUBMIT_SUMMARY', text })}
          onDismiss={() => dispatch({ type: 'DISMISS_SUMMARY' })}
        />
      )}
    </div>
  );
}
