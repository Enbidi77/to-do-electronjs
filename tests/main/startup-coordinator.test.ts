import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from 'electron'
import { StartupCoordinator } from '../../src/main/system/startup-coordinator'

vi.mock('../../src/main/database/connection', () => ({
  initializeDatabase: vi.fn(),
  closeDatabase: vi.fn()
}))

vi.mock('../../src/main/services/settings-service', () => ({
  SettingsService: class {
    getAll() {
      return {
        theme: 'system',
        language: 'en',
        startWithWindows: false,
        closeToTray: true
      }
    }
  }
}))

vi.mock('../../src/main/notifications/notification-service', () => ({
  NotificationService: {
    getInstance: vi.fn(() => ({
      setMainWindow: vi.fn(),
      show: vi.fn()
    }))
  }
}))

vi.mock('../../src/main/scheduler/reminder-scheduler', () => ({
  ReminderScheduler: {
    getInstance: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn()
    }))
  }
}))

vi.mock('../../src/main/system/power-monitor', () => ({
  initPowerMonitor: vi.fn()
}))

vi.mock('../../src/main/tray/tray-manager', () => ({
  createTrayManager: vi.fn(() => ({
    destroy: vi.fn()
  }))
}))

vi.mock('../../src/main/windows/main-window', () => ({
  createMainWindow: vi.fn(() => ({
    isDestroyed: () => false,
    isVisible: () => false,
    show: vi.fn(),
    focus: vi.fn(),
    destroy: vi.fn(),
    once: vi.fn((event, cb) => {
      if (event === 'ready-to-show') setTimeout(cb, 5)
    })
  }))
}))

vi.mock('../../src/main/windows/splash-window', () => ({
  transitionFromSplash: vi.fn()
}))

describe('StartupCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    StartupCoordinator.getInstance().setMinDurationMs(0)
  })

  it('provides singleton instance with valid initial state', () => {
    const coordinator = StartupCoordinator.getInstance()
    const state = coordinator.getState()

    expect(state.appName).toBe('Todo')
    expect(state.phase).toBeDefined()
    expect(state.error).toBeNull()
    expect(state.version).toBeDefined()
  })

  it('runs startup phases sequentially to ready', async () => {
    const coordinator = StartupCoordinator.getInstance()
    await coordinator.start()

    const state = coordinator.getState()
    expect(state.phase).toBe('ready')
    expect(state.error).toBeNull()
  })

  it('enforces minimum splash screen duration', async () => {
    const coordinator = StartupCoordinator.getInstance()
    coordinator.setMinDurationMs(150)

    const start = Date.now()
    await coordinator.start()
    const elapsed = Date.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(140)
  })

  it('captures database error and sets friendly error state without throwing', async () => {
    const { initializeDatabase } = await import('../../src/main/database/connection')
    vi.mocked(initializeDatabase).mockImplementationOnce(() => {
      throw new Error('SQLite disk I/O error')
    })

    const coordinator = StartupCoordinator.getInstance()
    await coordinator.start()

    const state = coordinator.getState()
    expect(state.phase).toBe('error')
    expect(state.error).toContain('workspace database')
  })

  it('cleans up resources and restarts when retry is called', async () => {
    const { closeDatabase, initializeDatabase } = await import('../../src/main/database/connection')
    vi.mocked(initializeDatabase).mockImplementation(() => {})

    const coordinator = StartupCoordinator.getInstance()
    await coordinator.retry()

    expect(closeDatabase).toHaveBeenCalled()
    const state = coordinator.getState()
    expect(state.phase).toBe('ready')
  })

  it('delegates quit to app.quit', async () => {
    const coordinator = StartupCoordinator.getInstance()
    await coordinator.quit()

    expect(app.quit).toHaveBeenCalled()
  })
})
