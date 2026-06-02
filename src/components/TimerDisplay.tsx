import { formatTime } from '../lib/time';
import type { AppState } from '../types';

interface TimerDisplayProps {
  state: AppState;
  elapsed: number;
}

export function TimerDisplay({ state, elapsed }: TimerDisplayProps) {
  if (state.status === 'idle') {
    return (
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h1 className="font-display text-6xl md:text-8xl font-bold text-gray-800 tracking-tight select-none">
          FlowTime
        </h1>
        <p className="mt-4 text-gray-400 font-display text-lg tracking-widest uppercase select-none">
          心流守护者
        </p>
      </div>
    );
  }

  const timeStr = formatTime(elapsed);
  const colorClass = state.status === 'break' ? 'text-break-text' : 'text-flow-text';

  return (
    <div className="animate-fade-in select-none">
      <div
        className={`font-mono leading-none tabular-nums ${colorClass}`}
        style={{
          fontSize: 'clamp(3.5rem, 14vw, 11rem)'
        }}
      >
        {timeStr}
      </div>
    </div>
  );
}
