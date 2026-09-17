import { app, BrowserWindow, nativeTheme } from 'electron'
import { APP_NAME, MIN_SPLASH_DURATION_MS } from '@shared/constants'
import { IPC_CHANNELS, StartupPhase, StartupState } from '@shared/types'
import { initializeDatabase, closeDatabase } from '../database/connection'
import { SettingsService } from '../services/settings-service'
import { ReminderScheduler } from '../scheduler/reminder-scheduler'
import { NotificationService } from '../notifications/notification-service'
import { initPowerMonitor } from './power-monitor'
import { createTrayManager, TrayManager } from '../tray/tray-manager'
import { createMainWindow } from '../windows/main-window'
import { transitionFromSplash } from '../windows/splash-window'
import { createLogger } from './logger'

const logger = createLogger('StartupCoordinator')

const STATUS_MESSAGES: Record<'en' | 'vi', Record<StartupPhase, string>> = {
  en: {
    initializing: 'Starting application...',
    database: 'Connecting to workspace...',
    migrations: 'Setting up data structures...',
    settings: 'Loading preferences...',
    scheduler: 'Starting reminders...',
    tray: 'Preparing workspace...',
    window: 'Opening workspace...',
    ready: 'Ready',
    error: 'Unable to start the application.'
  },
  vi: {
    initializing: 'Đang khởi động ứng dụng...',
    database: 'Đang kết nối không gian làm việc...',
    migrations: 'Đang thiết lập cấu trúc dữ liệu...',
    settings: 'Đang tải tùy chọn...',
    scheduler: 'Đang chuẩn bị lời nhắc...',
    tray: 'Đang chuẩn bị không gian làm việc...',
    window: 'Đang mở không gian làm việc...',
    ready: 'Sẵn sàng',
    error: 'Không thể khởi động ứng dụng.'
  }
}

function detectSystemLanguage(): 'en' | 'vi' {
  try {
    const locale = (app.getLocale() || '').toLowerCase()
    if (locale.startsWith('vi')) {
      return 'vi'
    }
  } catch {
    // Fallback to English
  }
  return 'en'
}

export class StartupCoordinator {
  private static instance: StartupCoordinator | null = null
  private state: StartupState
  private splashWindow: BrowserWindow | null = null
  private mainWindow: BrowserWindow | null = null
  private scheduler: ReminderScheduler | null = null
  private trayManager: TrayManager | null = null
  private isInitializing = false
  private minDurationMs: number = MIN_SPLASH_DURATION_MS

  private constructor() {
    const initialLang = detectSystemLanguage()
    this.state = {
      phase: 'initializing',
      message: STATUS_MESSAGES[initialLang].initializing,
      error: null,
      version: app.isPackaged ? app.getVersion() : `v${app.getVersion()}`,
      appName: APP_NAME,
      theme: 'system',
      systemIsDark: nativeTheme.shouldUseDarkColors,
      language: initialLang
    }
  }

  public static getInstance(): StartupCoordinator {
    if (!StartupCoordinator.instance) {
      StartupCoordinator.instance = new StartupCoordinator()
    }
    return StartupCoordinator.instance
  }

  public getState(): StartupState {
    return { ...this.state }
  }

  public setMinDurationMs(ms: number): void {
    this.minDurationMs = ms
  }

  public setSplashWindow(win: BrowserWindow | null): void {
    this.splashWindow = win
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  public getScheduler(): ReminderScheduler | null {
    return this.scheduler
  }

  public getTrayManager(): TrayManager | null {
    return this.trayManager
  }

  private updateState(updates: Partial<StartupState>): void {
    this.state = { ...this.state, ...updates }
    this.broadcastState()
  }

  private broadcastState(): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        try {
          win.webContents.send(IPC_CHANNELS.EVENT_STARTUP_STATUS, this.state)
        } catch (e) {
          // Ignore if sending fails during window transition
        }
      }
    }
  }

  /**
   * Orchestrates the startup sequence:
   * Database -> Settings -> Scheduler -> Tray -> Main Window -> Splash transition
   */
  public async start(): Promise<void> {
    if (this.isInitializing) {
      logger.warn('Startup already in progress')
      return
    }

    this.isInitializing = true
    const startTime = Date.now()

    try {
      logger.info('Starting application initialization...')
      const lang = this.state.language

      // 1. Initializing
      this.updateState({
        phase: 'initializing',
        message: STATUS_MESSAGES[lang].initializing,
        error: null
      })

      // 2. Database & Migrations
      this.updateState({
        phase: 'database',
        message: STATUS_MESSAGES[lang].database
      })
      logger.info('Phase: database')
      initializeDatabase()

      // 3. Settings & Appearance
      this.updateState({
        phase: 'settings',
        message: STATUS_MESSAGES[lang].settings
      })
      logger.info('Phase: settings')
      const settingsService = new SettingsService()
      const settings = settingsService.getAll()

      // Update state with saved preferences if available
      const currentLang = settings.language === 'vi' ? 'vi' : 'en'
      const currentTheme = settings.theme || 'system'
      this.updateState({
        language: currentLang,
        theme: currentTheme,
        systemIsDark: nativeTheme.shouldUseDarkColors
      })

      if (settings.startWithWindows) {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: app.getPath('exe')
        })
      }

      // 4. Notification Service & Reminder Scheduler
      this.updateState({
        phase: 'scheduler',
        message: STATUS_MESSAGES[currentLang].scheduler
      })
      logger.info('Phase: scheduler')
      const notificationService = NotificationService.getInstance()

      this.scheduler = ReminderScheduler.getInstance()
      this.scheduler.start()
      initPowerMonitor(this.scheduler)

      // 5. Main Window (Created hidden)
      this.updateState({
        phase: 'window',
        message: STATUS_MESSAGES[currentLang].window
      })
      logger.info('Phase: window')
      this.mainWindow = createMainWindow(false)

      notificationService.setMainWindow(this.mainWindow)

      // 6. System Tray
      this.updateState({
        phase: 'tray',
        message: STATUS_MESSAGES[currentLang].tray
      })
      logger.info('Phase: tray')
      if (!this.trayManager) {
        this.trayManager = createTrayManager(this.mainWindow)
      }

      // 7. Wait for main window readiness
      await this.waitForMainWindowReady()

      // 8. Ensure minimum splash screen display time to prevent instant disappearing
      const elapsed = Date.now() - startTime
      const remaining = this.minDurationMs - elapsed
      if (remaining > 0) {
        logger.info(`Holding splash screen for remaining ${remaining}ms (min duration: ${this.minDurationMs}ms)`)
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      this.updateState({
        phase: 'ready',
        message: STATUS_MESSAGES[currentLang].ready
      })
      logger.info('Application ready, transitioning from splash')

      await transitionFromSplash(this.splashWindow, this.mainWindow)
      this.splashWindow = null
      this.isInitializing = false
    } catch (err: unknown) {
      this.isInitializing = false
      logger.error('Startup failed during phase: ' + this.state.phase, err)

      const lang = this.state.language
      const isDbError = this.state.phase === 'database' || this.state.phase === 'migrations'
      const friendlyError = isDbError
        ? (lang === 'vi'
            ? 'Không thể mở hoặc thiết lập cơ sở dữ liệu. Vui lòng kiểm tra quyền truy cập đĩa và thử lại.'
            : 'Could not connect to or initialize the workspace database. Please check disk access and retry.')
        : (lang === 'vi'
            ? 'Đã xảy ra sự cố trong quá trình khởi động. Vui lòng thử lại hoặc thoát.'
            : 'An unexpected problem occurred during startup. Please retry or quit.')

      this.updateState({
        phase: 'error',
        message: STATUS_MESSAGES[lang].error,
        error: friendlyError
      })
    }
  }

  private waitForMainWindowReady(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        resolve()
        return
      }

      let resolved = false
      const onReady = () => {
        if (!resolved) {
          resolved = true
          resolve()
        }
      }

      this.mainWindow.once('ready-to-show', onReady)

      // Safety timeout: don't hang splash indefinitely if ready-to-show is missed
      setTimeout(onReady, 2500)
    })
  }

  public async retry(): Promise<void> {
    if (this.isInitializing) return
    logger.info('Retrying startup initialization...')

    // Cleanup any partial instances safely and idempotently
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.destroy()
      } catch {}
      this.mainWindow = null
    }

    if (this.scheduler) {
      try {
        this.scheduler.stop()
      } catch {}
      this.scheduler = null
    }

    if (this.trayManager) {
      try {
        this.trayManager.destroy()
      } catch {}
      this.trayManager = null
    }

    closeDatabase()

    await this.start()
  }

  public async quit(): Promise<void> {
    logger.info('Quitting application from startup...')
    app.quit()
  }
}
