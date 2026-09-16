import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import { TaskService } from '../services/task-service'
import { ProjectService } from '../services/project-service'
import { TagService } from '../services/tag-service'
import { ReminderService } from '../services/reminder-service'
import { SettingsService } from '../services/settings-service'
import { createLogger } from '../system/logger'

const logger = createLogger('IPC')

function broadcastTaskUpdated(task?: any): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_TASK_UPDATED, task)
    }
  })
}

function registerTaskHandlers(): void {
  const service = new TaskService()

  ipcMain.handle(IPC_CHANNELS.TASKS_LIST, async (_event, options) => {
    try { return service.list(options) }
    catch (error) { logger.error('tasks:list failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_GET, async (_event, id: string) => {
    try { return service.get(id) }
    catch (error) { logger.error('tasks:get failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_CREATE, async (_event, input) => {
    try {
      const result = service.create(input)
      broadcastTaskUpdated(result)
      return result
    }
    catch (error) { logger.error('tasks:create failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_UPDATE, async (_event, id: string, input) => {
    try {
      const result = service.update(id, input)
      broadcastTaskUpdated(result)
      return result
    }
    catch (error) { logger.error('tasks:update failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_DELETE, async (_event, id: string) => {
    try {
      const result = service.delete(id)
      broadcastTaskUpdated()
      return result
    }
    catch (error) { logger.error('tasks:delete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_COMPLETE, async (_event, id: string) => {
    try {
      const result = service.complete(id)
      broadcastTaskUpdated(result)
      return result
    }
    catch (error) { logger.error('tasks:complete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_UNCOMPLETE, async (_event, id: string) => {
    try {
      const result = service.uncomplete(id)
      broadcastTaskUpdated(result)
      return result
    }
    catch (error) { logger.error('tasks:uncomplete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_ARCHIVE, async (_event, id: string) => {
    try {
      const result = service.archive(id)
      broadcastTaskUpdated(result)
      return result
    }
    catch (error) { logger.error('tasks:archive failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_REORDER, async (_event, ids: string[]) => {
    try {
      const result = service.reorder(ids)
      broadcastTaskUpdated()
      return result
    }
    catch (error) { logger.error('tasks:reorder failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_GET_SUBTASKS, async (_event, parentId: string) => {
    try { return service.getSubtasks(parentId) }
    catch (error) { logger.error('tasks:getSubtasks failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_GET_STATS, async () => {
    try { return service.getStats() }
    catch (error) { logger.error('tasks:getStats failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TASKS_SEARCH, async (_event, query: string) => {
    try { return service.search(query) }
    catch (error) { logger.error('tasks:search failed', error); throw error }
  })
}

function registerProjectHandlers(): void {
  const service = new ProjectService()

  ipcMain.handle(IPC_CHANNELS.PROJECTS_LIST, async () => {
    try { return service.list() }
    catch (error) { logger.error('projects:list failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_GET, async (_event, id: string) => {
    try { return service.get(id) }
    catch (error) { logger.error('projects:get failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_CREATE, async (_event, input) => {
    try { return service.create(input) }
    catch (error) { logger.error('projects:create failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_UPDATE, async (_event, id: string, input) => {
    try { return service.update(id, input) }
    catch (error) { logger.error('projects:update failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_DELETE, async (_event, id: string) => {
    try { return service.delete(id) }
    catch (error) { logger.error('projects:delete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_REORDER, async (_event, ids: string[]) => {
    try { return service.reorder(ids) }
    catch (error) { logger.error('projects:reorder failed', error); throw error }
  })
}

function registerTagHandlers(): void {
  const service = new TagService()

  ipcMain.handle(IPC_CHANNELS.TAGS_LIST, async () => {
    try { return service.list() }
    catch (error) { logger.error('tags:list failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TAGS_CREATE, async (_event, input) => {
    try { return service.create(input) }
    catch (error) { logger.error('tags:create failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TAGS_UPDATE, async (_event, id: string, input) => {
    try { return service.update(id, input) }
    catch (error) { logger.error('tags:update failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TAGS_DELETE, async (_event, id: string) => {
    try { return service.delete(id) }
    catch (error) { logger.error('tags:delete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.TAGS_SET_TASK_TAGS, async (_event, taskId: string, tagIds: string[]) => {
    try { return service.setTaskTags(taskId, tagIds) }
    catch (error) { logger.error('tags:setTaskTags failed', error); throw error }
  })
}

function registerReminderHandlers(): void {
  const service = new ReminderService()

  ipcMain.handle(IPC_CHANNELS.REMINDERS_LIST, async (_event, taskId?: string) => {
    try { return service.list(taskId) }
    catch (error) { logger.error('reminders:list failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.REMINDERS_CREATE, async (_event, input) => {
    try { return service.create(input) }
    catch (error) { logger.error('reminders:create failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.REMINDERS_UPDATE, async (_event, id: string, input) => {
    try { return service.update(id, input) }
    catch (error) { logger.error('reminders:update failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.REMINDERS_DELETE, async (_event, id: string) => {
    try { return service.delete(id) }
    catch (error) { logger.error('reminders:delete failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.REMINDERS_SNOOZE, async (_event, id: string, duration) => {
    try { return service.snooze(id, duration) }
    catch (error) { logger.error('reminders:snooze failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.REMINDERS_GET_UPCOMING, async (_event, minutes?: number) => {
    try { return service.getUpcoming(minutes) }
    catch (error) { logger.error('reminders:getUpcoming failed', error); throw error }
  })
}

function registerSettingsHandlers(): void {
  const service = new SettingsService()

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    try { return service.getAll() }
    catch (error) { logger.error('settings:getAll failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_event, key: string) => {
    try { return service.get(key as keyof import('@shared/types').AppSettings) }
    catch (error) { logger.error('settings:get failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, key: string, value: unknown) => {
    try {
      service.set(key as keyof import('@shared/types').AppSettings, value as never)

      // Handle side effects
      if (key === 'startWithWindows') {
        const { app: electronApp } = await import('electron')
        electronApp.setLoginItemSettings({
          openAtLogin: value as boolean,
          path: electronApp.getPath('exe')
        })
      }
    }
    catch (error) { logger.error('settings:set failed', error); throw error }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_RESET, async () => {
    try { return service.reset() }
    catch (error) { logger.error('settings:reset failed', error); throw error }
  })
}

function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, async () => {
    const { app: electronApp } = await import('electron')
    return {
      version: electronApp.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      databasePath: require('path').join(electronApp.getPath('userData'), 'todo.sqlite')
    }
  })

  const getWindowFromEvent = async (event: Electron.IpcMainInvokeEvent) => {
    const { BrowserWindow } = await import('electron')
    return BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow()
  }

  // Window control handlers
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async (event) => {
    const win = await getWindowFromEvent(event)
    win?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async (event) => {
    const win = await getWindowFromEvent(event)
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE, async (event) => {
    const win = await getWindowFromEvent(event)
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, async (event) => {
    const win = await getWindowFromEvent(event)
    return win ? win.isMaximized() : false
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async (event) => {
    const win = await getWindowFromEvent(event)
    win?.close()
  })

  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, async (event) => {
    const win = await getWindowFromEvent(event)
    win?.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, async (event) => {
    const win = await getWindowFromEvent(event)
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, async (event) => {
    const win = await getWindowFromEvent(event)
    win?.close()
  })

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, async () => {
    const { app: electronApp } = await import('electron')
    electronApp.quit()
  })

  ipcMain.handle(IPC_CHANNELS.APP_TOGGLE_FULLSCREEN, async () => {
    const { BrowserWindow } = await import('electron')
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.setFullScreen(!win.isFullScreen())
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_OPEN_EXTERNAL, async (_event, url: string) => {
    const { shell } = await import('electron')
    // Validate URL before opening
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_EXPORT_DATA, async (_event, options) => {
    const { ExportService } = await import('../services/export-service')
    const service = new ExportService()
    if (options.format === 'csv') {
      return service.exportCSV(options)
    }
    return service.exportJSON(options)
  })

  ipcMain.handle(IPC_CHANNELS.APP_IMPORT_DATA, async (_event, filePath: string) => {
    const { ExportService } = await import('../services/export-service')
    const service = new ExportService()
    return service.importJSON(filePath)
  })

  ipcMain.handle(IPC_CHANNELS.APP_BACKUP_DATABASE, async () => {
    const { BackupService } = await import('../services/backup-service')
    const service = new BackupService()
    return service.createBackup()
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_BACKUPS, async () => {
    const { BackupService } = await import('../services/backup-service')
    const service = new BackupService()
    return service.listBackups()
  })

  ipcMain.handle(IPC_CHANNELS.APP_RESTORE_BACKUP, async (_event, filename: string) => {
    const { BackupService } = await import('../services/backup-service')
    const service = new BackupService()
    return service.restoreBackup(filename)
  })

  ipcMain.handle(IPC_CHANNELS.APP_SHOW_NOTIFICATION, async (_event, options: { title: string; body: string; taskId?: string }) => {
    try {
      const { NotificationService } = await import('../notifications/notification-service')
      NotificationService.getInstance().show(options.title, options.body, options.taskId)
    } catch (error) {
      logger.error('app:showNotification failed', error)
      throw error
    }
  })
}

/** Register all IPC handlers for the application */
export function registerAllIpcHandlers(): void {
  logger.info('Registering IPC handlers...')
  registerTaskHandlers()
  registerProjectHandlers()
  registerTagHandlers()
  registerReminderHandlers()
  registerSettingsHandlers()
  registerAppHandlers()
  logger.info('All IPC handlers registered')
}

