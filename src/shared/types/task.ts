// ============================================================================
// Task Types
// ============================================================================

import type { Project } from './project'
import type { Tag } from './tag'
import type { Reminder } from './reminder'

export type TaskStatus = 'active' | 'completed' | 'archived'
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  parentTaskId: string | null
  dueDate: string | null
  dueTime: string | null
  reminderEnabled: boolean
  reminderTime: string | null
  recurrenceRule: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  sortOrder: number
}

export interface TaskWithRelations extends Task {
  project: Project | null
  tags: Tag[]
  subtasks: Task[]
  reminders: Reminder[]
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority?: TaskPriority
  projectId?: string | null
  parentTaskId?: string | null
  dueDate?: string | null
  dueTime?: string | null
  reminderEnabled?: boolean
  reminderTime?: string | null
  recurrenceRule?: string | null
  sortOrder?: number
  tagIds?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string | null
  parentTaskId?: string | null
  dueDate?: string | null
  dueTime?: string | null
  reminderEnabled?: boolean
  reminderTime?: string | null
  recurrenceRule?: string | null
  sortOrder?: number
  tagIds?: string[]
  completedAt?: string | null
  archivedAt?: string | null
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  projectId?: string | null
  parentTaskId?: string | null
  dueDateFrom?: string
  dueDateTo?: string
  hasReminder?: boolean
  hasTag?: boolean
  tagId?: string
  search?: string
  isOverdue?: boolean
}

export type TaskSortField = 'sortOrder' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface TaskSort {
  field: TaskSortField
  direction: SortDirection
}

export interface TaskListOptions {
  filter?: TaskFilter
  sort?: TaskSort
  limit?: number
  offset?: number
}

