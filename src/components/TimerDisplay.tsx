import { useState, useEffect } from 'react';
import { formatTime } from '../lib/time';
import type { AppState } from '../types';

const FLOW_MESSAGES = [
  '专注当下，效率自然来',
  '深呼吸，保持节奏',
  '每个番茄钟都是进步',
  '心流状态，继续加油',
];

const FATIGUE_MESSAGES = [
  '要是累了，那么休息下吧',
  '已专注超过一小时，考虑休息一下',
  '适时休息，走得更远',
  '大脑需要恢复，建议结束当前任务',
];

interface TimerDisplayProps {
  state: AppState;
  elapsed: number;
}

export function TimerDisplay({ state, elapsed }: TimerDisplayProps) {
  const [flowIdx, setFlowIdx] = useState(0);
  const [fatigueIdx, setFatigueIdx] = useState(0);

  useEffect(() => {
    if (state.status !== 'flow') return;
    const interval = setInterval(() => {
      setFlowIdx((i) => (i + 1) % FLOW_MESSAGES.length);
      setFatigueIdx((i) => (i + 1) % FATIGUE_MESSAGES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [state.status]);

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
    <div className="animate-fade-in select-none flex flex-col items-center gap-3">
      <div
        className={`font-mono leading-none tabular-nums ${colorClass}`}
        style={{
          fontSize: 'clamp(3.5rem, 14vw, 11rem)'
        }}
      >
        {timeStr}
      </div>
      {state.status === 'flow' && (
        <div className="font-display text-flow-muted/60 text-sm tracking-wide animate-fade-in">
          {elapsed >= 3600 ? FATIGUE_MESSAGES[fatigueIdx] : FLOW_MESSAGES[flowIdx]}
        </div>
      )}
    </div>
  );
}
