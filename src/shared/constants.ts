// ============================================================================
// Application Constants
// ============================================================================

export const APP_NAME = 'Todo'
export const APP_ID = 'com.todoapp.desktop'

// Default project colors
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#a855f7'  // purple
] as const

// Tag colors
export const TAG_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316'
] as const

// Priority configuration
export const PRIORITY_CONFIG = {
  none: { label: 'None', color: '#9aa0a6', icon: null, sortWeight: 0 },
  low: { label: 'Low', color: '#8ab4f8', icon: '↓', sortWeight: 1 },
  medium: { label: 'Medium', color: '#fdd663', icon: '→', sortWeight: 2 },
  high: { label: 'High', color: '#f28b82', icon: '↑', sortWeight: 3 },
  urgent: { label: 'Urgent', color: '#ee675c', icon: '⇑', sortWeight: 4 }
} as const

// Scheduler
export const SCHEDULER_TICK_INTERVAL_MS = 30_000 // 30 seconds
export const SCHEDULER_LOOK_AHEAD_MINUTES = 60

// Pagination
export const DEFAULT_PAGE_SIZE = 50

// Keyboard shortcut definitions
export const KEYBOARD_SHORTCUTS = {
  CREATE_TASK: { key: 'n', ctrlKey: true, label: 'Create task' },
  QUICK_ADD: { key: ' ', ctrlKey: true, shiftKey: true, label: 'Quick Add' },
  SEARCH: { key: 'f', ctrlKey: true, label: 'Search' },
  COMMAND_PALETTE: { key: 'k', ctrlKey: true, label: 'Command palette' },
  TODAY: { key: '1', ctrlKey: true, label: 'Today' },
  UPCOMING: { key: '2', ctrlKey: true, label: 'Upcoming' },
  INBOX: { key: '3', ctrlKey: true, label: 'Inbox' },
  SETTINGS: { key: ',', ctrlKey: true, label: 'Settings' },
  COMPLETE_TASK: { key: ' ', label: 'Complete task' },
  OPEN_TASK: { key: 'Enter', label: 'Open task' },
  DELETE_TASK: { key: 'Delete', label: 'Delete task' },
  EDIT_TASK: { key: 'e', label: 'Edit task' },
  CLOSE: { key: 'Escape', label: 'Close' }
} as const

