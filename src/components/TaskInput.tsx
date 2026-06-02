import { useEffect, useRef } from 'react';
import type { AppState, AppEvent } from '../types';

interface TaskInputProps {
  state: Extract<AppState, { status: 'idle' }>;
  dispatch: React.Dispatch<AppEvent>;
}

export function TaskInput({ state, dispatch }: TaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      dispatch({ type: 'START' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <input
        ref={inputRef}
        type="text"
        value={state.draftTask}
        onChange={(e) => dispatch({ type: 'SET_DRAFT', text: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder="今天要专注什么？"
        className="font-display bg-transparent text-4xl md:text-5xl text-gray-800 text-center w-full max-w-2xl outline-none border-b-2 border-gray-300 pb-4 placeholder:text-gray-400 transition-colors focus:border-gray-500"
        maxLength={100}
      />
    </div>
  );
}
