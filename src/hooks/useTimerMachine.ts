import { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import type { AppState, AppEvent } from '../types';
import { fsmReducer, initialState, elapsedSec } from '../lib/fsm';
import { saveSession, clearSession } from '../lib/storage';
import { sendBreakNotification, sendFatigueNotification, setupTitleFlash } from '../lib/notify';
import { playFatigueTone } from '../lib/audio';
import { requestWakeLock, releaseWakeLock } from '../lib/wake_lock';
import { appendHistory } from '../lib/history';

export function useTimerMachine(): {
  state: AppState;
  dispatch: React.Dispatch<AppEvent>;
  elapsed: number;
  pausedFor: number;
} {
  const [state, dispatch] = useReducer(fsmReducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<{ stop: () => void } | null>(null);
  const [, setTick] = useState(0);
  const fatigueRef = useRef<{ phase60: boolean; phase90: boolean }>({ phase60: false, phase90: false });

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

  // Effect 1: 持久化（保存到 localStorage）
  useEffect(() => {
    if (state.status === 'flow') {
      saveSession({
        version: 2,
        status: 'flow',
        task: state.task,
        startedAt: state.startedAt,
        elapsedBeforePause: state.elapsedBeforePause,
        totalPausedSec: state.totalPausedSec
      });
    } else if (state.status === 'paused') {
      saveSession({
        version: 2,
        status: 'paused',
        task: state.task,
        startedAt: state.startedAt,
        elapsedBeforePause: state.elapsedAtPause,
        totalPausedSec: state.totalPausedSec,
        pausedAt: state.pausedAt
      });
    } else {
      clearSession();
    }
  }, [state]);

  // Effect 2: Interval 管理
  useEffect(() => {
    clearTimer();

    if (state.status === 'flow') {
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
    } else if (state.status === 'paused') {
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, 500);
    } else if (state.status === 'break') {
      flashRef.current = setupTitleFlash('FlowTime — 心流守护者');
      const breakEndsAt = state.breakEndsAt;
      const task = state.task;
      const pendingRecord = state.pendingRecord;
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
        if (breakEndsAt - Date.now() <= 0) {
          sendBreakNotification(task);
          appendHistory(pendingRecord);
          dispatch({ type: 'BREAK_DONE' });
        }
      }, 200);
    }

    return clearTimer;
  }, [state.status, clearTimer,
    state.status === 'break' ? (state as { breakEndsAt: number }).breakEndsAt : undefined,
    state.status === 'break' ? (state as { task: string }).task : undefined,
    state.status === 'break' ? (state as { pendingRecord: any }).pendingRecord : undefined,
  ]);

  // Effect 3: 页面可见性 + Wake Lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTick((t) => t + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (state.status === 'flow') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [state.status]);

  // Effect 4: 疲劳提醒
  useEffect(() => {
    if (state.status === 'flow') {
      const currentElapsed = elapsedSec(state);
      if (currentElapsed >= 3600 && !fatigueRef.current.phase60) {
        playFatigueTone();
        sendFatigueNotification(state.task, '60min');
        fatigueRef.current.phase60 = true;
      }
      if (currentElapsed >= 5400 && !fatigueRef.current.phase90) {
        playFatigueTone();
        sendFatigueNotification(state.task, '90min');
        fatigueRef.current.phase90 = true;
      }
    }
  }, [state]);

  // 重置疲劳提醒标志
  const previousStatusRef = useRef<AppState['status']>(state.status);
  useEffect(() => {
    const prev = previousStatusRef.current;
    const curr = state.status;
    if ((prev === 'flow' && curr === 'paused') ||
        (prev === 'paused' && curr === 'flow') ||
        (prev === 'flow' && curr === 'break') ||
        curr === 'idle') {
      fatigueRef.current.phase60 = false;
      fatigueRef.current.phase90 = false;
    }
    previousStatusRef.current = curr;
  }, [state.status]);

  // 实时 elapsed
  const elapsed =
    state.status === 'flow'
      ? Math.floor(elapsedSec(state))
      : state.status === 'paused'
        ? Math.floor(state.elapsedAtPause)
        : state.status === 'break'
          ? Math.max(0, Math.ceil((state.breakEndsAt - Date.now()) / 1000))
          : 0;

  const pausedFor =
    state.status === 'paused'
      ? Math.floor((Date.now() - state.pausedAt) / 1000)
      : 0;

  // Effect 5: break→idle 时保存历史（覆盖 SKIP_BREAK 场景）
  const prevStatusRef = useRef(state.status);
  const breakRecordRef = useRef(state.status === 'break' ? state.pendingRecord : null);
  useEffect(() => {
    if (state.status === 'break') {
      breakRecordRef.current = state.pendingRecord;
    }
    const prev = prevStatusRef.current;
    if (prev === 'break' && state.status === 'idle' && breakRecordRef.current) {
      appendHistory(breakRecordRef.current);
      breakRecordRef.current = null;
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.status === 'break' ? state.pendingRecord.id : '']);

  return { state, dispatch, elapsed, pausedFor };
}
