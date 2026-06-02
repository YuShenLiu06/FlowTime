import type { AppState, AppEvent } from '../types';
import { recommendBreakSec } from './time';

export function elapsedSec(state: Extract<AppState, { status: 'flow' }>): number {
  return state.elapsedBeforePause + (Date.now() - state.startedAt) / 1000;
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
        elapsedBeforePause: 0
      };
    default:
      return state;
  }
}

function handleFlow(state: Extract<AppState, { status: 'flow' }>, event: AppEvent): AppState {
  switch (event.type) {
    case 'TICK':
      return { ...state, elapsedBeforePause: state.elapsedBeforePause + 1 };
    case 'PAUSE':
      return {
        status: 'paused',
        task: state.task,
        elapsedAtPause: elapsedSec(state)
      };
    case 'FINISH': {
      const flowDuration = elapsedSec(state);
      return {
        status: 'break',
        task: state.task,
        flowDuration,
        breakEndsAt: Date.now() + recommendBreakSec(flowDuration) * 1000
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
        startedAt: Date.now(),
        elapsedBeforePause: state.elapsedAtPause
      };
    default:
      return state;
  }
}

function handleBreak(state: Extract<AppState, { status: 'break' }>, event: AppEvent): AppState {
  switch (event.type) {
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
      elapsedAtPause: session.elapsedBeforePause
    };
  } else {
    const elapsedSinceStart = (Date.now() - session.startedAt) / 1000;
    return {
      status: 'flow',
      task: session.task,
      startedAt: Date.now(),
      elapsedBeforePause: session.elapsedBeforePause + elapsedSinceStart
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
