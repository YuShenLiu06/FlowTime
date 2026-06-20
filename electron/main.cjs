const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// 必须与 electron-builder 配置中的 appId 完全一致，
// 否则 Windows 通知会归属到 "Electron" 而非 "FlowTime"。
const APP_USER_MODEL_ID = 'com.flowtime.app';
app.setAppUserModelId(APP_USER_MODEL_ID);

// 单实例锁：再次启动时聚焦已有窗口，而不是开启第二个进程。
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

function createWindow() {
  // 开发模式显式指定窗口图标；打包后窗口图标由 .exe 图标决定，无需指定。
  const iconPath = app.isPackaged
    ? undefined
    : path.join(__dirname, '..', 'build', 'icon.ico');

  const win = new BrowserWindow({
    width: 960,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'FlowTime',
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // 外链（window.open）交给系统浏览器，避免在应用内导航到外部站点。
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
