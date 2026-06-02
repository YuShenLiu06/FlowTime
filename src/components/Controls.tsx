import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import type { AppState, AppEvent } from '../types';

interface ControlsProps {
  state: AppState;
  dispatch: React.Dispatch<AppEvent>;
}

export function Controls({ state, dispatch }: ControlsProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    if (state.status === 'flow' || state.status === 'paused') {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2000);
    }
  }, [state.status]);

  useEffect(() => {
    resetHideTimer();
    window.addEventListener('mousemove', resetHideTimer);
    window.addEventListener('keydown', resetHideTimer);
    return () => {
      window.removeEventListener('mousemove', resetHideTimer);
      window.removeEventListener('keydown', resetHideTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  if (state.status === 'idle') {
    return (
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <button
          onClick={() => dispatch({ type: 'START' })}
          className="w-24 h-24 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          aria-label="开始"
        >
          <Play size={40} className="ml-1" fill="currentColor" />
        </button>
      </div>
    );
  }

  if (state.status === 'break') {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => dispatch({ type: 'SKIP_BREAK' })}
          className="px-8 py-4 rounded-full bg-break-surface/50 text-break-text hover:bg-break-surface/70 transition-all duration-300 flex items-center gap-2 font-mono text-lg"
        >
          <SkipForward size={20} />
          跳过休息
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-6 transition-opacity duration-500 ${
        controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {state.status === 'flow' ? (
        <button
          onClick={() => dispatch({ type: 'PAUSE' })}
          className="w-16 h-16 rounded-full bg-white/10 text-flow-text hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
          aria-label="暂停"
        >
          <Pause size={32} fill="currentColor" />
        </button>
      ) : (
        <button
          onClick={() => dispatch({ type: 'RESUME' })}
          className="w-16 h-16 rounded-full bg-white/10 text-flow-text hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
          aria-label="继续"
        >
          <Play size={32} className="ml-1" fill="currentColor" />
        </button>
      )}
      <button
        onClick={() => dispatch({ type: 'FINISH' })}
        className="w-16 h-16 rounded-full bg-white/10 text-flow-text hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
        aria-label="结束"
      >
        <Square size={28} fill="currentColor" />
      </button>
    </div>
  );
}
