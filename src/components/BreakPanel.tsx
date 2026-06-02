import { formatTime } from '../lib/time';
import type { AppState } from '../types';

interface BreakPanelProps {
  state: Extract<AppState, { status: 'break' }>;
}

export function BreakPanel({ state }: BreakPanelProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-4 mb-8">
      <div className="text-break-muted font-display text-2xl tracking-widest uppercase select-none">
        休息中
      </div>
      <div className="text-break-muted/60 font-mono text-sm tabular-nums">
        上一段专注 {formatTime(Math.floor(state.flowDuration))}
      </div>
    </div>
  );
}
