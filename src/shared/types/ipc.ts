// ============================================================================
// IPC Channel Definitions and API Types
// ============================================================================

import type {
  Task,
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListOptions
} from './task'
import type { Project, CreateProjectInput, UpdateProjectInput } from './project'
import type { Tag, CreateTagInput, UpdateTagInput } from './tag'
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeDuration
} from './reminder'
import type { AppSettings, SettingKey } from './settings'

// ============================================================================
// IPC Channels — single source of truth for all channel names
// ============================================================================

export const IPC_CHANNELS = {
  // Tasks
  TASKS_LIST: 'tasks:list',
  TASKS_GET: 'tasks:get',
  TASKS_CREATE: 'tasks:create',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',
  TASKS_COMPLETE: 'tasks:complete',
  TASKS_UNCOMPLETE: 'tasks:uncomplete',
  TASKS_ARCHIVE: 'tasks:archive',
  TASKS_REORDER: 'tasks:reorder',
  TASKS_GET_SUBTASKS: 'tasks:getSubtasks',
  TASKS_GET_STATS: 'tasks:getStats',
  TASKS_SEARCH: 'tasks:search',

  // Projects
  PROJECTS_LIST: 'projects:list',
  PROJECTS_GET: 'projects:get',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_REORDER: 'projects:reorder',

  // Tags
  TAGS_LIST: 'tags:list',
  TAGS_CREATE: 'tags:create',
  TAGS_UPDATE: 'tags:update',
  TAGS_DELETE: 'tags:delete',
  TAGS_SET_TASK_TAGS: 'tags:setTaskTags',

  // Reminders
  REMINDERS_LIST: 'reminders:list',
  REMINDERS_CREATE: 'reminders:create',
  REMINDERS_UPDATE: 'reminders:update',
  REMINDERS_DELETE: 'reminders:delete',
  REMINDERS_SNOOZE: 'reminders:snooze',
  REMINDERS_GET_UPCOMING: 'reminders:getUpcoming',

  // Settings
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',

  // App
  APP_GET_INFO: 'app:getInfo',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
  APP_QUIT: 'app:quit',
  APP_TOGGLE_FULLSCREEN: 'app:toggleFullscreen',
  APP_OPEN_EXTERNAL: 'app:openExternal',
  APP_SHOW_NOTIFICATION: 'app:showNotification',
  APP_EXPORT_DATA: 'app:exportData',
  APP_IMPORT_DATA: 'app:importData',
  APP_BACKUP_DATABASE: 'app:backupDatabase',
  APP_GET_BACKUPS: 'app:getBackups',
  APP_RESTORE_BACKUP: 'app:restoreBackup',

  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_TOGGLE_MAXIMIZE: 'window:toggleMaximize',
  WINDOW_IS_MAXIMIZED: 'window:isMaximized',
  WINDOW_CLOSE: 'window:close',

  // Events (main → renderer)
  EVENT_TASK_UPDATED: 'event:taskUpdated',
  EVENT_REMINDER_FIRED: 'event:reminderFired',
  EVENT_NOTIFICATION_CLICKED: 'event:notificationClicked',
  EVENT_NAVIGATE_TO_TASK: 'event:navigateToTask',
  EVENT_QUICK_ADD: 'event:quickAdd',
  EVENT_THEME_CHANGED: 'event:themeChanged',
  EVENT_WINDOW_MAXIMIZE_CHANGED: 'event:windowMaximizeChanged'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

// ============================================================================
// IPC API — the typed API exposed via contextBridge
// ============================================================================

export interface TaskStats {
  total: number
  active: number
  completed: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  withReminders: number
}

export interface AppInfo {
  version: string
  electronVersion: string
  nodeVersion: string
  chromeVersion: string
  platform: string
  databasePath: string
}

export interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: string
}

export interface ExportOptions {
  format: 'json' | 'csv'
  includeCompleted: boolean
  includeArchived: boolean
}

export interface ImportResult {
  tasksImported: number
  projectsImported: number
  tagsImported: number
  errors: string[]
}

export interface IpcApi {
  tasks: {
    list(options?: TaskListOptions): Promise<Task[]>
    get(id: string): Promise<TaskWithRelations | null>
    create(input: CreateTaskInput): Promise<Task>
    update(id: string, input: UpdateTaskInput): Promise<Task>
    delete(id: string): Promise<void>
    complete(id: string): Promise<Task>
    uncomplete(id: string): Promise<Task>
    archive(id: string): Promise<Task>
    reorder(ids: string[]): Promise<void>
    getSubtasks(parentId: string): Promise<Task[]>
    getStats(): Promise<TaskStats>
    search(query: string): Promise<Task[]>
  }

  projects: {
    list(): Promise<Project[]>
    get(id: string): Promise<Project | null>
    create(input: CreateProjectInput): Promise<Project>
    update(id: string, input: UpdateProjectInput): Promise<Project>
    delete(id: string): Promise<void>
    reorder(ids: string[]): Promise<void>
  }

  tags: {
    list(): Promise<Tag[]>
    create(input: CreateTagInput): Promise<Tag>
    update(id: string, input: UpdateTagInput): Promise<Tag>
    delete(id: string): Promise<void>
    setTaskTags(taskId: string, tagIds: string[]): Promise<void>
  }

  reminders: {
    list(taskId?: string): Promise<Reminder[]>
    create(input: CreateReminderInput): Promise<Reminder>
    update(id: string, input: UpdateReminderInput): Promise<Reminder>
    delete(id: string): Promise<void>
    snooze(id: string, duration: SnoozeDuration): Promise<Reminder>
    getUpcoming(minutes?: number): Promise<Reminder[]>
  }

  settings: {
    getAll(): Promise<AppSettings>
    get<K extends SettingKey>(key: K): Promise<AppSettings[K]>
    set<K extends SettingKey>(key: K, value: AppSettings[K]): Promise<void>
    reset(): Promise<void>
  }

  window: TodoWindowApi

  app: {
    getInfo(): Promise<AppInfo>
    minimize(): Promise<void>
    maximize(): Promise<void>
    close(): Promise<void>
    quit(): Promise<void>
    toggleFullscreen(): Promise<void>
    openExternal(url: string): Promise<void>
    exportData(options: ExportOptions): Promise<string>
    importData(filePath: string): Promise<ImportResult>
    backupDatabase(): Promise<BackupInfo>
    getBackups(): Promise<BackupInfo[]>
    restoreBackup(filename: string): Promise<void>
    showNotification(options: { title: string; body: string; taskId?: string }): Promise<void>
  }

  // Event listeners (main → renderer)
  on: {
    taskUpdated(callback: (task: Task) => void): () => void
    reminderFired(callback: (reminder: Reminder) => void): () => void
    notificationClicked(callback: (taskId: string) => void): () => void
    navigateToTask(callback: (taskId: string) => void): () => void
    quickAdd(callback: () => void): () => void
    themeChanged(callback: (theme: string) => void): () => void
    windowMaximizeChanged(callback: (isMaximized: boolean) => void): () => void
  }
}

export interface TodoWindowApi {
  minimize(): Promise<void>
  toggleMaximize(): Promise<void>
  isMaximized(): Promise<boolean>
  close(): Promise<void>
  onMaximizeChanged(callback: (isMaximized: boolean) => void): () => void
}

export interface TodoApi {
  window: TodoWindowApi
}


