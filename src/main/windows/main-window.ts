import { BrowserWindow, app, nativeTheme } from 'electron';
import path from 'path';
import { settingsService } from '../services/settings-service';
import { IPC_CHANNELS } from '@shared/types';

let isQuitting = false;

export function setIsQuitting(quitting: boolean): void {
  isQuitting = quitting;
}

export function createMainWindow(showOnReady = true): BrowserWindow {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../../resources/icon.ico');

  // Determine initial theme to prevent any white flash
  let isDark = nativeTheme.shouldUseDarkColors;
  try {
    const savedTheme = settingsService.get('theme');
    if (savedTheme === 'dark') isDark = true;
    else if (savedTheme === 'light') isDark = false;
  } catch {
    // Fall back to system preference
  }
  const initialBgColor = isDark ? '#1f2023' : '#f8fafc';

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    resizable: true,
    backgroundColor: initialBgColor,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/index.js'),
    }
  });

  if (showOnReady) {
    mainWindow.on('ready-to-show', () => {
      mainWindow.show();
    });
  }

  mainWindow.on('maximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, false);
    }
  });

  mainWindow.on('close', (event) => {
    // If closeToTray setting enabled, hide to tray instead of quitting
    const closeToTray = settingsService.get('closeToTray');
    if (closeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}
