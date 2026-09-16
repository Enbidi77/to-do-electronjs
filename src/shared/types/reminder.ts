// ============================================================================
// Reminder Types
// ============================================================================

export interface Reminder {
  id: string
  taskId: string
  scheduledAt: string
  notificationTitle: string
  notificationBody: string | null
  enabled: boolean
  firedAt: string | null
  snoozedUntil: string | null
  createdAt: string
}

export interface CreateReminderInput {
  taskId: string
  scheduledAt: string
  notificationTitle: string
  notificationBody?: string | null
  enabled?: boolean
}

export interface UpdateReminderInput {
  scheduledAt?: string
  notificationTitle?: string
  notificationBody?: string | null
  enabled?: boolean
  snoozedUntil?: string | null
}

export type SnoozeDuration = '5m' | '10m' | '30m' | '1h' | 'tomorrow'

export const SNOOZE_DURATIONS: Record<SnoozeDuration, { label: string; minutes: number | null }> = {
  '5m': { label: '5 minutes', minutes: 5 },
  '10m': { label: '10 minutes', minutes: 10 },
  '30m': { label: '30 minutes', minutes: 30 },
  '1h': { label: '1 hour', minutes: 60 },
  tomorrow: { label: 'Tomorrow', minutes: null }
}

