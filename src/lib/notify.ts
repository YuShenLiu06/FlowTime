export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendBreakNotification(_task: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  new Notification('FlowTime', {
    body: '休息结束 — 准备开始下一段专注',
    tag: 'flowtime-break'
  });
}

export function setupTitleFlash(initialTitle: string): { stop: () => void } {
  let flashOn = false;
  const intervalId = setInterval(() => {
    flashOn = !flashOn;
    document.title = flashOn ? `⏰ ${initialTitle}` : initialTitle;
  }, 1000);

  return {
    stop: () => {
      clearInterval(intervalId);
      document.title = initialTitle;
    }
  };
}
