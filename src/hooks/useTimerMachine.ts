import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import type { AppState, AppEvent } from '../types';
import { fsmReducer, initialState, elapsedSec } from '../lib/fsm';
import { saveSession, clearSession } from '../lib/storage';
import { sendBreakNotification, setupTitleFlash } from '../lib/notify';

export function useTimerMachine(): {
  state: AppState;
  dispatch: React.Dispatch<AppEvent>;
  elapsed: number;
} {
  const [state, dispatch] = useReducer(fsmReducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<{ stop: () => void } | null>(null);
  const [, setTick] = useState(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (flashRef.current) {
      flashRef.current.stop();
      flashRef.current = null;
    }
  }, []);

  // 持久化
  useEffect(() => {
    if (state.status === 'flow') {
      saveSession({
        version: 1,
        status: 'flow',
        task: state.task,
        startedAt: state.startedAt,
        elapsedBeforePause: state.elapsedBeforePause,
      });
    } else if (state.status === 'paused') {
      saveSession({
        version: 1,
        status: 'paused',
        task: state.task,
        startedAt: Date.now(),
        elapsedBeforePause: state.elapsedAtPause,
      });
    } else {
      clearSession();
    }
  }, [state]);

  // Interval 管理
  useEffect(() => {
    clearTimer();

    if (state.status === 'flow') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
        setTick((t) => t + 1);
      }, 1000);
    } else if (state.status === 'break') {
      flashRef.current = setupTitleFlash('FlowTime — 心流守护者');
      const breakEndsAt = state.breakEndsAt;
      const task = state.task;
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
        if (breakEndsAt - Date.now() <= 0) {
          sendBreakNotification(task);
          dispatch({ type: 'BREAK_DONE' });
        }
      }, 200);
    }

    return clearTimer;
  }, [state.status, clearTimer, dispatch,
    state.status === 'break' ? (state as { breakEndsAt: number }).breakEndsAt : undefined,
    state.status === 'break' ? (state as { task: string }).task : undefined,
  ]);

  // 实时 elapsed
  const elapsed =
    state.status === 'flow'
      ? Math.floor(elapsedSec(state))
      : state.status === 'paused'
        ? Math.floor(state.elapsedAtPause)
        : state.status === 'break'
          ? Math.max(0, Math.ceil((state.breakEndsAt - Date.now()) / 1000))
          : 0;

  return { state, dispatch, elapsed };
}
