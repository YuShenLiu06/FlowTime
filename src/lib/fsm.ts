import type { AppState, AppEvent, TaskRecord } from '../types';
import { recommendBreakSec } from './time';

export function elapsedSec(state: Extract<AppState, { status: 'flow' }>): number {
  return (Date.now() - state.startedAt) / 1000 - state.totalPausedSec;
}

function handleIdle(state: Extract<AppState, { status: 'idle' }>, event: AppEvent): AppState {
  switch (event.type) {
    case 'SET_DRAFT':
      return { ...state, draftTask: event.text };
    case 'START':
      if (state.draftTask.trim() === '') return state;
      return {
        status: 'flow',
        task: state.draftTask,
        startedAt: Date.now(),
        elapsedBeforePause: 0,
        totalPausedSec: 0
      };
    default:
      return state;
  }
}

function handleFlow(state: Extract<AppState, { status: 'flow' }>, event: AppEvent): AppState {
  switch (event.type) {
    case 'TICK':
      return state;
    case 'TIME_WARP':
      return { ...state, startedAt: state.startedAt - event.shiftMs };
    case 'PAUSE':
      return {
        status: 'paused',
        task: state.task,
        startedAt: state.startedAt,
        elapsedAtPause: elapsedSec(state),
        totalPausedSec: state.totalPausedSec,
        pausedAt: Date.now()
      };
    case 'FINISH': {
      const flowDuration = elapsedSec(state);
      const pausedDurationSec = state.totalPausedSec;
      const pendingRecord: TaskRecord = {
        id: crypto.randomUUID(),
        task: state.task,
        startedAt: state.startedAt,
        finishedAt: Date.now(),
        flowDurationSec: flowDuration,
        pausedDurationSec,
        summary: '',
      };
      return {
        status: 'break',
        task: state.task,
        flowDuration,
        breakEndsAt: Date.now() + recommendBreakSec(flowDuration) * 1000,
        isPendingSummary: true,
        pendingRecord
      };
    }
    default:
      return state;
  }
}

function handlePaused(state: Extract<AppState, { status: 'paused' }>, event: AppEvent): AppState {
  switch (event.type) {
    case 'RESUME':
      return {
        status: 'flow',
        task: state.task,
        startedAt: state.startedAt,
        elapsedBeforePause: state.elapsedAtPause,
        totalPausedSec: state.totalPausedSec + (Date.now() - state.pausedAt) / 1000,
      };
    default:
      return state;
  }
}

function handleBreak(state: Extract<AppState, { status: 'break' }>, event: AppEvent): AppState {
  switch (event.type) {
    case 'SUBMIT_SUMMARY':
      return {
        ...state,
        isPendingSummary: false,
        pendingRecord: { ...state.pendingRecord, summary: event.text }
      };
    case 'DISMISS_SUMMARY':
      return { ...state, isPendingSummary: false };
    case 'OPEN_SUMMARY':
      return { ...state, isPendingSummary: true };
    case 'SKIP_BREAK':
    case 'BREAK_DONE':
      return { status: 'idle', draftTask: '' };
    default:
      return state;
  }
}

function handleRestore(event: Extract<AppEvent, { type: 'RESTORE' }>): AppState {
  const { session } = event;
  if (session.status === 'paused') {
    return {
      status: 'paused',
      task: session.task,
      startedAt: session.startedAt,
      elapsedAtPause: session.elapsedBeforePause,
      totalPausedSec: session.totalPausedSec,
      pausedAt: session.pausedAt ?? Date.now()
    };
  } else {
    return {
      status: 'flow',
      task: session.task,
      startedAt: session.startedAt,
      elapsedBeforePause: session.elapsedBeforePause,
      totalPausedSec: session.totalPausedSec
    };
  }
}

export function fsmReducer(state: AppState, event: AppEvent): AppState {
  if (event.type === 'RESTORE') {
    return handleRestore(event);
  }

  switch (state.status) {
    case 'idle':
      return handleIdle(state, event);
    case 'flow':
      return handleFlow(state, event);
    case 'paused':
      return handlePaused(state, event);
    case 'break':
      return handleBreak(state, event);
    default:
      return state;
  }
}

export const initialState: AppState = { status: 'idle', draftTask: '' };
