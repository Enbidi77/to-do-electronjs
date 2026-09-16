import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type {
  IpcApi,
  TaskListOptions,
  CreateTaskInput,
  UpdateTaskInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTagInput,
  UpdateTagInput,
  CreateReminderInput,
  UpdateReminderInput,
  SnoozeDuration,
  SettingKey,
  AppSettings,
  ExportOptions,
  ReorderTaskInput,
  MoveTaskInput,
  ChangeTaskStatusInput,
  MakeSubtaskInput,
  Task,
  Reminder
} from '@shared/types'
import { IPC_CHANNELS } from '@shared/types'

const api: IpcApi = {
  tasks: {
    list: (options?: TaskListOptions) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_LIST, options),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_GET, id),
    create: (input: CreateTaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_CREATE, input),
    update: (id: string, input: UpdateTaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_UPDATE, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_DELETE, id),
    complete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_COMPLETE, id),
    uncomplete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_UNCOMPLETE, id),
    archive: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_ARCHIVE, id),
    reorder: (ids: string[]) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_REORDER, ids),
    reorderTask: (input: ReorderTaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_REORDER_TASK, input),
    move: (input: MoveTaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_MOVE, input),
    changeStatus: (input: ChangeTaskStatusInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_CHANGE_STATUS, input),
    makeSubtask: (input: MakeSubtaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_MAKE_SUBTASK, input),
    getSubtasks: (parentId: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_GET_SUBTASKS, parentId),
    getStats: () => ipcRenderer.invoke(IPC_CHANNELS.TASKS_GET_STATS),
    search: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_SEARCH, query)
  },
  projects: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_LIST),
    get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_GET, id),
    create: (input: CreateProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_CREATE, input),
    update: (id: string, input: UpdateProjectInput) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_UPDATE, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_DELETE, id),
    reorder: (ids: string[]) => ipcRenderer.invoke(IPC_CHANNELS.PROJECTS_REORDER, ids)
  },
  tags: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.TAGS_LIST),
    create: (input: CreateTagInput) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_CREATE, input),
    update: (id: string, input: UpdateTagInput) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_UPDATE, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_DELETE, id),
    setTaskTags: (taskId: string, tagIds: string[]) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_SET_TASK_TAGS, taskId, tagIds)
  },
  reminders: {
    list: (taskId?: string) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_LIST, taskId),
    create: (input: CreateReminderInput) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_CREATE, input),
    update: (id: string, input: UpdateReminderInput) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_UPDATE, id, input),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_DELETE, id),
    snooze: (id: string, duration: SnoozeDuration) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_SNOOZE, id, duration),
    getUpcoming: (minutes?: number) => ipcRenderer.invoke(IPC_CHANNELS.REMINDERS_GET_UPCOMING, minutes)
  },
  settings: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
    get: <K extends SettingKey>(key: K) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: <K extends SettingKey>(key: K, value: AppSettings[K]) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET)
  },
  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    toggleMaximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    onMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
      const handler = (_event: IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler)
      }
    }
  },
  app: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO),
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.APP_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.APP_CLOSE),
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    toggleFullscreen: () => ipcRenderer.invoke(IPC_CHANNELS.APP_TOGGLE_FULLSCREEN),
    openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_EXTERNAL, url),
    exportData: (options: ExportOptions) => ipcRenderer.invoke(IPC_CHANNELS.APP_EXPORT_DATA, options),
    importData: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_IMPORT_DATA, filePath),
    backupDatabase: () => ipcRenderer.invoke(IPC_CHANNELS.APP_BACKUP_DATABASE),
    getBackups: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_BACKUPS),
    restoreBackup: (filename: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_RESTORE_BACKUP, filename),
    showNotification: (options: { title: string; body: string; taskId?: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_SHOW_NOTIFICATION, options)
  },
  on: {
    taskUpdated: (callback: (task: Task) => void) => {
      const handler = (_event: IpcRendererEvent, task: Task) => callback(task)
      ipcRenderer.on(IPC_CHANNELS.EVENT_TASK_UPDATED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TASK_UPDATED, handler)
      }
    },
    reminderFired: (callback: (reminder: Reminder) => void) => {
      const handler = (_event: IpcRendererEvent, reminder: Reminder) => callback(reminder)
      ipcRenderer.on(IPC_CHANNELS.EVENT_REMINDER_FIRED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_REMINDER_FIRED, handler)
      }
    },
    notificationClicked: (callback: (taskId: string) => void) => {
      const handler = (_event: IpcRendererEvent, taskId: string) => callback(taskId)
      ipcRenderer.on(IPC_CHANNELS.EVENT_NOTIFICATION_CLICKED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_NOTIFICATION_CLICKED, handler)
      }
    },
    navigateToTask: (callback: (taskId: string) => void) => {
      const handler = (_event: IpcRendererEvent, taskId: string) => callback(taskId)
      ipcRenderer.on(IPC_CHANNELS.EVENT_NAVIGATE_TO_TASK, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_NAVIGATE_TO_TASK, handler)
      }
    },
    quickAdd: (callback: () => void) => {
      const handler = () => callback()
      ipcRenderer.on(IPC_CHANNELS.EVENT_QUICK_ADD, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_QUICK_ADD, handler)
      }
    },
    themeChanged: (callback: (theme: string) => void) => {
      const handler = (_event: IpcRendererEvent, theme: string) => callback(theme)
      ipcRenderer.on(IPC_CHANNELS.EVENT_THEME_CHANGED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_THEME_CHANGED, handler)
      }
    },
    windowMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
      const handler = (_event: IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
      ipcRenderer.on(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler)
      }
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('todo', { window: api.window, tasks: api.tasks })
  } catch (error) {
    console.error('Failed to expose context bridge in main world', error)
  }
} else {
  // @ts-ignore
  window.api = api
  // @ts-ignore
  window.todo = { window: api.window, tasks: api.tasks }
}
