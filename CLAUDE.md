# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlowTime is a PWA (Progressive Web App) focus timer that implements a finite state machine (FSM) to manage user workflow: idle → flow (working) → paused → break (rest). The app persists sessions to localStorage and supports recovery after page refresh or browser closure.

## Core Architecture

The application is built around a **pure state machine** pattern:

- **State types** (`src/types.ts`): Discriminated union `AppState` with four variants — `idle`, `flow`, `paused`, `break`
- **Events** (`src/types.ts`): Discriminated union `AppEvent` representing state transitions
- **Reducer** (`src/lib/fsm.ts`): Pure function `fsmReducer(state, event) -> newState` — all state logic lives here
- **Hook** (`src/hooks/useTimerMachine.ts`): Wraps the reducer, manages side effects (localStorage, intervals, notifications)

### Key Design Principle

**State logic is pure; side effects are isolated in the hook.** When modifying behavior:
- State transitions → edit `fsmReducer`
- Persistence/timers/notifications → edit `useTimerMachine`
- Never mix concerns

### Module Organization

```
src/
├── types.ts              — AppState, AppEvent, TaskRecord, PersistedSession types
├── lib/
│   ├── fsm.ts            — Pure state machine reducer and helpers
│   ├── time.ts           — Time formatting and break duration calculation
│   ├── storage.ts        — localStorage save/load/clear with error handling
│   ├── notify.ts         — Browser notification API and title flashing
│   ├── history.ts        — Task history persistence (TaskRecord CRUD)
│   ├── stats.ts          — Statistics calculations (daily, weekly, averages)
│   ├── audio.ts          — Audio feedback (fatigue tones)
│   └── wake_lock.ts      — Screen wake lock management
├── hooks/
│   ├── useTimerMachine.ts  — Main hook: reducer + intervals + persistence + history
│   └── useRecovery.ts      — One-time session restoration on mount
├── components/
│   ├── TaskInput.tsx       — Task name input (idle state only)
│   ├── TimerDisplay.tsx    — Large time display, changes based on state
│   ├── Controls.tsx        — Action buttons (auto-hides during flow/paused)
│   ├── BreakPanel.tsx      — Break countdown and message
│   ├── SummaryDialog.tsx   — Task summary modal dialog
│   ├── PausedTimer.tsx     — Pause duration indicator with pulse animation
│   └── AppNav.tsx          — Top navigation bar with history link
└── pages/
    ├── HomePage.tsx        — Main timer page
    └── HistoryPage.tsx     — Task history dashboard with Recharts
```

### State Persistence

- `flow` and `paused` states are persisted to `localStorage` key `flowtime.session`
- On app mount, `useRecovery` dispatches `RESTORE` event if session exists
- Restored `flow` sessions recalculate elapsed time to account for time away
- Version field (`PersistedSession.version`) guards against future schema changes
- Task history (completed tasks with summaries) is persisted to `flowtime.history`

### Break State & Summary Flow

When `FINISH` event is received from `flow` or `paused`:
1. Creates a `TaskRecord` with duration, pause time, and task name
2. Enters `break` state with `isPendingSummary: true`
3. Shows `SummaryDialog` modal for user to add notes
4. On submit/dismiss, saves record to history (via `appendHistory`)
5. Break timer continues to count down independently

### History Page Features

- Statistics cards: today, week total, task count, average session
- Recharts bar chart showing last 14 days of focus time
- Collapsible task list showing all completed tasks
- Time formatting: uses `formatTime()` for human-readable display

### Routing

Uses `react-router-dom` with HashRouter:
- `/` → `HomePage` (timer)
- `/history` → `HistoryPage` (dashboard)

## Development Commands

```bash
# Development server with HMR
npm run dev

# Type-check then build for production
npm run build

# Lint TypeScript/React code
npm run lint

# Preview production build locally
npm run preview
```

## PWA Configuration

PWA is configured in `vite.config.ts` using `vite-plugin-pwa`:
- `registerType: 'autoUpdate'` — Service worker auto-updates
- Manifest defines app name, theme colors, and icons
- Workbox caches `**/*.{js,css,html,svg,png,ico}`

PWA icons (`pwa-192x192.png`, `pwa-512x512.png`) should be in the project root.

## Styling

- Tailwind CSS for utility classes
- Custom color scheme in `tailwind.config.ts`: `flow.*` (working state) and `break.*` (rest state)
- Fonts: Space Grotesk (display), JetBrains Mono (monospace numbers)
- Animations defined in Tailwind config: `fade-in`, `fade-out`, `slide-up`
- Background pattern: `.noise-bg` class (defined in `src/index.css`)

## Common Tasks

**Adding a new state or event:**
1. Update `AppState` or `AppEvent` union types in `src/types.ts`
2. Add handler in `src/lib/fsm.ts` (follow existing pattern)
3. Add case in `fsmReducer` switch statement
4. Update components that dispatch new events

**Modifying break duration logic:**
- Edit `recommendBreakSec()` in `src/lib/time.ts`

**Adding browser notifications:**
- Use `sendBreakNotification()` pattern from `src/lib/notify.ts`
- Call `requestNotificationPermission()` first (e.g., on user interaction)

**Persisting additional data:**
- Extend `PersistedSession` interface with new fields
- Update version number to invalidate old sessions
- Modify `saveSession` and `loadSession` in `src/lib/storage.ts`

**Adding statistics:**
- Add calculation functions in `src/lib/stats.ts`
- Use in HistoryPage via `useMemo()` for performance

**Customizing SummaryDialog:**
- Edit `src/components/SummaryDialog.tsx`
- Uses native HTML `<dialog>` element
- Controlled via `isOpen` prop from `break` state
