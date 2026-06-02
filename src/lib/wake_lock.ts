let sentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if (!('wakeLock' in navigator)) return false;
    sentinel = await (navigator as any).wakeLock.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release();
    sentinel = null;
  } catch {
    // ignore
  }
}
