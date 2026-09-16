import { app, BrowserWindow, globalShortcut } from 'electron'
import { initializeDatabase } from './database/connection'
import { registerAllIpcHandlers } from './ipc/register'
import { createMainWindow, setIsQuitting } from './windows/main-window'
import { createQuickAddWindow } from './windows/quick-add-window'
import { createTrayManager, TrayManager } from './tray/tray-manager'
import { ReminderScheduler } from './scheduler/reminder-scheduler'
import { NotificationService } from './notifications/notification-service'
import { initPowerMonitor } from './system/power-monitor'
import { SettingsService } from './services/settings-service'
import { createLogger } from './system/logger'

const logger = createLogger('App')

// Singleton references
let mainWindow: BrowserWindow | null = null
let scheduler: ReminderScheduler | null = null
let trayManager: TrayManager | null = null

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
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      logger.info('Application starting...')

      // Initialize database
      initializeDatabase()
      logger.info('Database initialized')

      // Register IPC handlers
      registerAllIpcHandlers()
      logger.info('IPC handlers registered')

      // Create main window
      mainWindow = createMainWindow()
      logger.info('Main window created')

      // Create system tray
      trayManager = createTrayManager(mainWindow)
      logger.info('System tray created')

      // Initialize notification service
      const notificationService = NotificationService.getInstance()
      notificationService.setMainWindow(mainWindow)

      // Initialize and start reminder scheduler
      scheduler = ReminderScheduler.getInstance()
      scheduler.start()
      logger.info('Reminder scheduler started')

      // Initialize power monitor
      initPowerMonitor(scheduler)
      logger.info('Power monitor initialized')

      // Register global shortcuts
      globalShortcut.register('CommandOrControl+Shift+Space', () => {
        logger.info('Global Quick Add shortcut triggered')
        const quickAddWindow = createQuickAddWindow()
        quickAddWindow.on('closed', () => {
          // Notify main window to refresh tasks
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('event:quickAdd')
          }
        })
      })

      // Apply startup settings
      const settingsService = new SettingsService()
      const settings = settingsService.getAll()
      if (settings.startWithWindows) {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: app.getPath('exe')
        })
      }

      logger.info('Application ready')
    } catch (error) {
      logger.error('Failed to initialize application', error)
      app.quit()
    }
  })

  app.on('window-all-closed', () => {
    // On Windows, don't quit when all windows closed (tray keeps running)
    // Only quit if close-to-tray is disabled
    const settingsService = new SettingsService()
    const settings = settingsService.getAll()
    if (!settings.closeToTray) {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    logger.info('Application quitting...')
    setIsQuitting(true)
    if (scheduler) {
      scheduler.stop()
    }
    if (trayManager) {
      trayManager = null
    }
    globalShortcut.unregisterAll()
  })

  app.on('activate', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
    }
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
}

