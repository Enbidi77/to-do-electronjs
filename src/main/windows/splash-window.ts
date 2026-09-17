import { BrowserWindow, app, nativeTheme } from 'electron'
import path from 'path'
import { APP_NAME } from '@shared/constants'

let splashWindowInstance: BrowserWindow | null = null

export function getSplashWindow(): BrowserWindow | null {
  if (splashWindowInstance && !splashWindowInstance.isDestroyed()) {
    return splashWindowInstance
  }
  return null
}

export function createSplashWindow(): BrowserWindow {
  if (splashWindowInstance && !splashWindowInstance.isDestroyed()) {
    return splashWindowInstance
  }

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../../resources/icon.ico')

  // Theme-aware initial background color to prevent any white flash
  const isDark = nativeTheme.shouldUseDarkColors
  const initialBgColor = isDark ? '#1f2023' : '#f8fafc'

  const win = new BrowserWindow({
    title: APP_NAME,
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    show: false,
    center: true,
    backgroundColor: initialBgColor,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  splashWindowInstance = win

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show()
    }
  })

  win.on('closed', () => {
    splashWindowInstance = null
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/splash`)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'splash' })
  }

  return win
}

export function destroySplashWindow(): void {
  if (splashWindowInstance && !splashWindowInstance.isDestroyed()) {
    splashWindowInstance.destroy()
    splashWindowInstance = null
  }
}

/**
 * Transitions smoothly from the splash window to the main window.
 * Keeps transition short (~150ms) to avoid unnecessary waiting.
 */
export async function transitionFromSplash(
  splash: BrowserWindow | null,
  main: BrowserWindow
): Promise<void> {
  if (!main || main.isDestroyed()) return

  if (splash && !splash.isDestroyed()) {
    // Subtle fade out if supported
    try {
      let opacity = 1.0
      const fadeInterval = setInterval(() => {
        if (splash.isDestroyed()) {
          clearInterval(fadeInterval)
          return
        }
        opacity -= 0.25
        if (opacity <= 0.1) {
          clearInterval(fadeInterval)
          splash.destroy()
          splashWindowInstance = null
        } else {
          splash.setOpacity(opacity)
        }
      }, 25)
    } catch {
      splash.destroy()
      splashWindowInstance = null
    }
  }

  if (!main.isVisible()) {
    main.show()
    main.focus()
  }
}
