import { useEffect, useCallback } from 'react';
import { useTimerMachine } from './hooks/useTimerMachine';
import { useRecovery } from './hooks/useRecovery';
import { TaskInput } from './components/TaskInput';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { BreakPanel } from './components/BreakPanel';
import type { AppState } from './types';

function bgClass(state: AppState): string {
  switch (state.status) {
    case 'idle': return 'bg-stone-100';
    case 'flow':
    case 'paused': return 'bg-flow-bg noise-bg';
    case 'break': return 'bg-break-bg noise-bg';
  }
}

function App() {
  const { state, dispatch, elapsed } = useTimerMachine();
  useRecovery(dispatch);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
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
    <div
      className={`min-h-dvh w-full flex flex-col items-center justify-center relative transition-colors duration-1000 ${bgClass(state)}`}
    >
      {/* 任务名 - 顶部偏移 */}
      {showTask && (
        <div className="absolute top-[15%] animate-fade-in">
          <span className="font-mono text-lg text-flow-muted/60 tracking-wide select-none">
            {state.task}
          </span>
          {state.status === 'paused' && (
            <span className="ml-3 text-flow-muted/40 text-sm">已暂停</span>
          )}
        </div>
      )}

      {/* 中央时间 / 品牌 */}
      <div className="flex flex-col items-center">
        {state.status === 'break' && <BreakPanel state={state} />}
        <TimerDisplay state={state} elapsed={elapsed} />
      </div>

      {/* 控件 - 底部偏移 */}
      <div className="absolute bottom-[15%]">
        {state.status === 'idle' ? (
          <div className="flex flex-col items-center gap-14">
            <TaskInput state={state} dispatch={dispatch} />
            <Controls state={state} dispatch={dispatch} />
          </div>
        ) : (
          <Controls state={state} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}

export default App;
