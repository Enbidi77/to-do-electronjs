import { app, globalShortcut } from 'electron'
import { registerAllIpcHandlers } from './ipc/register'
import { setIsQuitting } from './windows/main-window'
import { createSplashWindow } from './windows/splash-window'
import { createQuickAddWindow } from './windows/quick-add-window'
import { StartupCoordinator } from './system/startup-coordinator'
import { SettingsService } from './services/settings-service'
import { createLogger } from './system/logger'

const logger = createLogger('App')

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // Set Application User Model ID for Windows toast notifications
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.isPackaged ? 'com.todoapp.desktop' : process.execPath)
  }

  app.on('second-instance', () => {
    const coordinator = StartupCoordinator.getInstance()
    const mainWindow = coordinator.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      logger.info('Application starting...')

      // 1. Register IPC handlers early so splash & window can communicate
      registerAllIpcHandlers()
      logger.info('IPC handlers registered')

      // 2. Create and show Splash Window immediately
      const splashWindow = createSplashWindow()
      logger.info('Splash window created')

      // 3. Coordinate application startup sequence through StartupCoordinator
      const coordinator = StartupCoordinator.getInstance()
      coordinator.setSplashWindow(splashWindow)

      // 4. Register global shortcuts
      globalShortcut.register('CommandOrControl+Shift+Space', () => {
        logger.info('Global Quick Add shortcut triggered')
        const quickAddWindow = createQuickAddWindow()
        quickAddWindow.on('closed', () => {
          const mainWin = coordinator.getMainWindow()
          if (mainWin && !mainWin.isDestroyed()) {
            mainWin.webContents.send('event:quickAdd')
          }
        })
      })

      // 5. Start initialization phases
      await coordinator.start()
    } catch (error) {
      logger.error('Failed to initialize application', error)
    }
  })

  app.on('window-all-closed', () => {
    // On Windows, don't quit when all windows closed (tray keeps running)
    // Only quit if close-to-tray is disabled
    try {
      const settingsService = new SettingsService()
      const settings = settingsService.getAll()
      if (!settings.closeToTray) {
        app.quit()
      }
    } catch {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    logger.info('Application quitting...')
    setIsQuitting(true)
    const coordinator = StartupCoordinator.getInstance()
    const scheduler = coordinator.getScheduler()
    if (scheduler) {
      scheduler.stop()
    }
    const trayManager = coordinator.getTrayManager()
    if (trayManager) {
      trayManager.destroy()
    }
    globalShortcut.unregisterAll()
  })

  app.on('activate', () => {
    const coordinator = StartupCoordinator.getInstance()
    const mainWindow = coordinator.getMainWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
}

