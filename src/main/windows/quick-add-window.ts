import { BrowserWindow, app } from 'electron';
import path from 'path';

export function createQuickAddWindow(): BrowserWindow {
  const quickAddWindow = new BrowserWindow({
    width: 500,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    show: false,
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/index.js'),
    }
  });

  quickAddWindow.once('ready-to-show', () => {
    quickAddWindow.show();
  });

  quickAddWindow.on('blur', () => {
    quickAddWindow.hide();
  });

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    quickAddWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/quick-add`);
  } else {
    quickAddWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'quick-add' });
  }

  // Escape key handled in renderer to call close via IPC
  return quickAddWindow;
}
