import type { TaskRecord } from '../types';

export interface DailyStat {
  date: string;
  totalSec: number;
  taskCount: number;
}

function toDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayString(): string {
  return toDateString(Date.now());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateString(d.getTime());
}

export function getDailyStats(history: TaskRecord[], days = 14): DailyStat[] {
  const today = getTodayString();
  const statsByDate = new Map<string, DailyStat>();

  for (let i = 0; i < days; i++) {
    const date = addDays(today, -i);
    statsByDate.set(date, { date, totalSec: 0, taskCount: 0 });
  }

  for (const record of history) {
    const date = toDateString(record.finishedAt);
    const stat = statsByDate.get(date);
    if (stat) {
      stat.totalSec += record.flowDurationSec;
      stat.taskCount += 1;
    }
  }

  return Array.from(statsByDate.values()).reverse();
}

function getMondayTimestamp(): number {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getWeekTotal(history: TaskRecord[]): number {
  const monday = getMondayTimestamp();
  let total = 0;
  for (const record of history) {
    if (record.finishedAt >= monday) {
      total += record.flowDurationSec;
    }
  }
  return total;
}

export function getTaskCount(history: TaskRecord[]): number {
  return history.length;
}

export function getAverageSession(history: TaskRecord[]): number {
  if (history.length === 0) return 0;
  const total = history.reduce((sum, r) => sum + r.flowDurationSec, 0);
  return Math.round(total / history.length);
}

export function getTodayTotal(history: TaskRecord[]): number {
  const today = getTodayString();
  let total = 0;
  for (const record of history) {
    if (toDateString(record.finishedAt) === today) {
      total += record.flowDurationSec;
    }
  }
  return total;
}
