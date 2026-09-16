// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  // General
  startWithWindows: boolean
  closeToTray: boolean
  confirmBeforeDelete: boolean
  defaultProjectId: string | null

  // Notifications
  notificationsEnabled: boolean
  notificationSound: boolean
  defaultSnoozeDuration: string
  showOverdueReminders: boolean

  // Appearance
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'vi'
  compactMode: boolean

  // Data
  autoBackupEnabled: boolean
  autoBackupIntervalHours: number
  autoBackupRetentionDays: number
  databasePath: string

  // Debug
  debugLogging: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  startWithWindows: false,
  closeToTray: true,
  confirmBeforeDelete: true,
  defaultProjectId: null,
  notificationsEnabled: true,
  notificationSound: true,
  defaultSnoozeDuration: '10m',
  showOverdueReminders: true,
  theme: 'system',
  language: 'en',
  compactMode: false,
  autoBackupEnabled: false,
  autoBackupIntervalHours: 24,
  autoBackupRetentionDays: 30,
  databasePath: '',
  debugLogging: false
}

export type SettingKey = keyof AppSettings

