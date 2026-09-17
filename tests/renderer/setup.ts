import { vi } from 'vitest'

// Mock the window.api for renderer tests
const mockApi = {
  tasks: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    complete: vi.fn(),
    uncomplete: vi.fn(),
    archive: vi.fn(),
    reorder: vi.fn(),
    reorderTask: vi.fn(),
    move: vi.fn(),
    changeStatus: vi.fn(),
    makeSubtask: vi.fn(),
    getSubtasks: vi.fn(),
    search: vi.fn(),
    getStats: vi.fn()
  },
  reminders: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    snooze: vi.fn()
  },
  projects: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  tags: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  stages: {
    list: vi.fn().mockResolvedValue([
      { id: 'active', name: 'To Do', color: '#94a3b8', icon: 'circle', sortOrder: 1000, isCompleted: false, createdAt: '', updatedAt: '' },
      { id: 'in_progress', name: 'In Progress', color: '#f59e0b', icon: 'clock', sortOrder: 2000, isCompleted: false, createdAt: '', updatedAt: '' },
      { id: 'completed', name: 'Done', color: '#10b981', icon: 'check-circle-2', sortOrder: 3000, isCompleted: true, createdAt: '', updatedAt: '' }
    ]),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn()
  },
  settings: {
    getAll: vi.fn().mockResolvedValue({}),
    get: vi.fn(),
    set: vi.fn(),
    reset: vi.fn(),
    update: vi.fn()
  },
  app: {
    getInfo: vi.fn().mockResolvedValue({
      version: '1.0.0',
      electronVersion: '32.3.3',
      nodeVersion: '20.18.1',
      chromeVersion: '128.0',
      platform: 'win32',
      databasePath: 'C:\\test\\todo.sqlite'
    }),
    quit: vi.fn(),
    minimize: vi.fn(),
    maximize: vi.fn()
  },
  startup: {
    getState: vi.fn().mockResolvedValue({
      phase: 'initializing',
      message: 'Preparing your workspace...',
      error: null,
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'en'
    }),
    retry: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn(() => () => {})
  },
  on: {
    taskUpdated: vi.fn(() => () => {}),
    reminderFired: vi.fn(() => () => {}),
    startupStatusChanged: vi.fn(() => () => {})
  },
  window: {
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    toggleMaximize: vi.fn().mockResolvedValue(undefined),
    isMaximized: vi.fn().mockResolvedValue(false),
    close: vi.fn().mockResolvedValue(undefined),
    onMaximizeChanged: vi.fn(() => () => {})
  }
}

// @ts-ignore
window.api = mockApi
// @ts-ignore
window.todo = {
  window: mockApi.window,
  tasks: mockApi.tasks,
  startup: mockApi.startup
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
