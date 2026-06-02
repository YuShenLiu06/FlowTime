export function formatTime(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function recommendBreakSec(flowSec: number): number {
  if (flowSec < 25 * 60) return 5 * 60;
  if (flowSec < 50 * 60) return 8 * 60;
  if (flowSec < 90 * 60) return 12 * 60;
  return 15 * 60;
}
