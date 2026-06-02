import { formatTime } from '../lib/time';

interface PausedTimerProps {
  pausedFor: number;
}

export function PausedTimer({ pausedFor }: PausedTimerProps) {
  return (
    <div className="flex items-center gap-2 text-flow-muted/50 text-sm font-mono">
      <span className="w-2 h-2 rounded-full bg-flow-muted/50 animate-pulse" />
      <span>已暂停 {formatTime(pausedFor)}</span>
    </div>
  );
}
