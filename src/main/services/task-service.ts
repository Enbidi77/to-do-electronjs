import { db } from '../database/connection'
import { tasks, taskTags, tags, projects, reminders } from '../database/schema'
import { eq, and, or, like, desc, asc, lte, gte, isNull, isNotNull, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { RRule } from 'rrule'
import type {
  Task,
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
  TaskListOptions,
  TaskStats,
  TaskStatus,
  TaskPriority,
  ReorderTaskInput,
  MoveTaskInput,
  ChangeTaskStatusInput,
  MakeSubtaskInput
} from '@shared/types'
import { createLogger } from '../system/logger'
import { reminderService } from './reminder-service'
import { ReminderScheduler } from '../scheduler/reminder-scheduler'
import { stageService } from './stage-service'

const logger = createLogger('TaskService')

export class TaskService {
  /** List tasks with filtering, sorting, and pagination */
  list(options?: TaskListOptions): Task[] {
    const filter = options?.filter
    const sort = options?.sort
    const conditions: ReturnType<typeof eq>[] = []

    // Only top-level tasks by default (exclude subtasks unless specifically filtering for them)
    if (filter?.parentTaskId === undefined) {
      conditions.push(isNull(tasks.parentTaskId))
    } else if (filter.parentTaskId === null) {
      conditions.push(isNull(tasks.parentTaskId))
    } else if (filter.parentTaskId) {
      conditions.push(eq(tasks.parentTaskId, filter.parentTaskId))
    }

    // Status filter
    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        conditions.push(inArray(tasks.status, filter.status))
      } else {
        conditions.push(eq(tasks.status, filter.status))
      }
    }

    // Priority filter
    if (filter?.priority) {
      if (Array.isArray(filter.priority)) {
        conditions.push(inArray(tasks.priority, filter.priority))
      } else {
        conditions.push(eq(tasks.priority, filter.priority))
      }
    }

    // Project filter
    if (filter?.projectId !== undefined) {
      if (filter.projectId === null) {
        conditions.push(isNull(tasks.projectId))
      } else {
        conditions.push(eq(tasks.projectId, filter.projectId))
      }
    }

    // Tag filter
    if (filter?.tagId) {
      const taggedTaskIds = db
        .select({ taskId: taskTags.taskId })
        .from(taskTags)
        .where(eq(taskTags.tagId, filter.tagId))
        .all()
        .map(r => r.taskId)
      if (taggedTaskIds.length === 0) {
        return []
      }
      conditions.push(inArray(tasks.id, taggedTaskIds))
    }

    // Due date range filters
    if (filter?.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, filter.dueDateFrom))
    }
    if (filter?.dueDateTo) {
      conditions.push(lte(tasks.dueDate, filter.dueDateTo))
    }

    // Overdue filter
    if (filter?.isOverdue) {
      const today = new Date().toISOString().split('T')[0]
      conditions.push(lte(tasks.dueDate, today))
      conditions.push(isNotNull(tasks.dueDate))
      conditions.push(eq(tasks.status, 'active'))
    }

    // Has reminder filter
    if (filter?.hasReminder) {
      conditions.push(eq(tasks.reminderEnabled, 1))
    }

    // Text search
    if (filter?.search) {
      const searchTerm = `%${filter.search}%`
      conditions.push(
        or(
          like(tasks.title, searchTerm),
          like(tasks.description, searchTerm)
        )!
      )
    }

    // Build query
    let query = db.select().from(tasks)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    // Sorting
    if (sort) {
      const dir = sort.direction === 'asc' ? asc : desc
      switch (sort.field) {
        case 'dueDate':
          query = query.orderBy(dir(tasks.dueDate), desc(tasks.sortOrder)) as typeof query
          break
        case 'priority':
          query = query.orderBy(dir(tasks.priority), desc(tasks.sortOrder)) as typeof query
          break
        case 'createdAt':
          query = query.orderBy(dir(tasks.createdAt)) as typeof query
          break
        case 'updatedAt':
          query = query.orderBy(dir(tasks.updatedAt)) as typeof query
          break
        case 'title':
          query = query.orderBy(dir(tasks.title)) as typeof query
          break
        case 'sortOrder':
        default:
          query = query.orderBy(desc(tasks.sortOrder), desc(tasks.createdAt)) as typeof query
          break
      }
    } else {
      query = query.orderBy(desc(tasks.sortOrder), desc(tasks.createdAt)) as typeof query
    }

    // Pagination
    if (options?.limit) {
      query = query.limit(options.limit) as typeof query
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query
    }

    const rows = query.all()
    return rows.map(r => this.mapTask(r))
  }

  private mapTask(row: typeof tasks.$inferSelect): Task {
    return {
      ...row,
      status: (row.status || 'active') as TaskStatus,
      priority: (row.priority || 'none') as TaskPriority,
      reminderEnabled: Boolean(row.reminderEnabled),
      sortOrder: row.sortOrder ?? 0,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString()
    }
  }

  /** Get a single task with all relations */
  get(id: string): TaskWithRelations | null {
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get()
    if (!task) return null

    // Get project
    let project = null
    if (task.projectId) {
      project = db.select().from(projects).where(eq(projects.id, task.projectId)).get() ?? null
    }

    // Get tags
    const tagRows = db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, id))
      .all()
    const taskTagList = tagRows.map(r => r.tag)

    // Get subtasks
    const subtasks = db
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, id))
      .orderBy(desc(tasks.sortOrder))
      .all()

    // Get reminders
    const taskReminders = db
      .select()
      .from(reminders)
      .where(eq(reminders.taskId, id))
      .all()

    return {
      ...this.mapTask(task),
      project,
      tags: taskTagList,
      subtasks: subtasks.map(s => this.mapTask(s)),
      reminders: taskReminders.map(r => ({
        ...r,
        enabled: Boolean(r.enabled)
      }))
    } as TaskWithRelations
  }

  /** Create a new task */
  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString()
    const id = nanoid()

    const newTask = {
      id,
      title: input.title,
      description: input.description ?? null,
      status: 'active' as const,
      priority: input.priority ?? 'none',
      projectId: input.projectId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      reminderEnabled: input.reminderEnabled ? 1 : 0,
      reminderTime: input.reminderTime ?? null,
      recurrenceRule: input.recurrenceRule ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      sortOrder: input.sortOrder ?? 0
    }

    db.insert(tasks).values(newTask).run()
    logger.info(`Task created: ${id} - ${input.title}`)

    // Set tags if provided
    if (input.tagIds && input.tagIds.length > 0) {
      const tagValues = input.tagIds.map(tagId => ({ taskId: id, tagId }))
      db.insert(taskTags).values(tagValues).run()
    }

    const createdTask = this.get(id) as Task
    try {
      reminderService.syncTaskReminder(createdTask)
      ReminderScheduler.getInstance().tick()
    } catch (err) {
      logger.warn('Failed to sync reminder on task creation', err)
    }

    return createdTask
  }

  /** Update an existing task */
  update(id: string, input: UpdateTaskInput): Task {
    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = { updatedAt: now }

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.status !== undefined) updateData.status = input.status
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.projectId !== undefined) updateData.projectId = input.projectId
    if (input.parentTaskId !== undefined) updateData.parentTaskId = input.parentTaskId
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate
    if (input.dueTime !== undefined) updateData.dueTime = input.dueTime
    if (input.reminderEnabled !== undefined) updateData.reminderEnabled = input.reminderEnabled ? 1 : 0
    if (input.reminderTime !== undefined) updateData.reminderTime = input.reminderTime
    if (input.recurrenceRule !== undefined) updateData.recurrenceRule = input.recurrenceRule
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder
    if (input.completedAt !== undefined) updateData.completedAt = input.completedAt
    if (input.archivedAt !== undefined) updateData.archivedAt = input.archivedAt

    db.update(tasks).set(updateData).where(eq(tasks.id, id)).run()

    // Update tags if provided
    if (input.tagIds !== undefined) {
      db.delete(taskTags).where(eq(taskTags.taskId, id)).run()
      if (input.tagIds.length > 0) {
        const tagValues = input.tagIds.map(tagId => ({ taskId: id, tagId }))
        db.insert(taskTags).values(tagValues).run()
      }
    }

    logger.info(`Task updated: ${id}`)
    const updatedTask = this.get(id) as Task

    try {
      reminderService.syncTaskReminder(updatedTask)
      ReminderScheduler.getInstance().tick()
    } catch (err) {
      logger.warn('Failed to sync reminder on task update', err)
    }

    return updatedTask
  }

  /** Delete a task and its subtasks */
  delete(id: string): void {
    // Delete subtasks
    const subtasks = db.select().from(tasks).where(eq(tasks.parentTaskId, id)).all()
    for (const subtask of subtasks) {
      this.delete(subtask.id)
    }

    // Delete tag associations
    db.delete(taskTags).where(eq(taskTags.taskId, id)).run()

    // Delete reminders
    reminderService.deleteForTask(id)

    // Delete task
    db.delete(tasks).where(eq(tasks.id, id)).run()
    logger.info(`Task deleted: ${id}`)
  }

  /** Complete a task. If recurring, create next occurrence */
  complete(id: string): Task {
    const task = this.get(id)
    if (!task) throw new Error(`Task not found: ${id}`)

    const now = new Date().toISOString()

    // Clean up pending reminders for completed task
    reminderService.deleteForTask(id)

    // Handle recurring tasks
    if (task.recurrenceRule) {
      try {
        const rule = RRule.fromString(task.recurrenceRule)
        const nextDate = rule.after(new Date())
        if (nextDate) {
          const nextTaskInput: CreateTaskInput = {
            title: task.title,
            description: task.description,
            projectId: task.projectId,
            parentTaskId: task.parentTaskId,
            priority: task.priority,
            dueDate: nextDate.toISOString().split('T')[0],
            dueTime: task.dueTime,
            reminderEnabled: task.reminderEnabled,
            reminderTime: task.reminderTime,
            recurrenceRule: task.recurrenceRule,
            sortOrder: task.sortOrder,
            tagIds: task.tags?.map(t => t.id)
          }
          this.create(nextTaskInput)
          logger.info(`Created next recurrence for task: ${id}`)
        }
      } catch (err) {
        logger.error('Failed to process recurrence rule', err)
      }
    }

    return this.update(id, { status: 'completed', completedAt: now } as UpdateTaskInput)
  }

  /** Uncomplete a task */
  uncomplete(id: string): Task {
    const uncompletedTask = this.update(id, { status: 'active', completedAt: null } as UpdateTaskInput)
    try {
      reminderService.syncTaskReminder(uncompletedTask)
      ReminderScheduler.getInstance().tick()
    } catch (err) {
      logger.warn('Failed to sync reminder on task uncomplete', err)
    }
    return uncompletedTask
  }

  /** Archive a task */
  archive(id: string): Task {
    const now = new Date().toISOString()
    return this.update(id, { status: 'archived', archivedAt: now } as UpdateTaskInput)
  }

  /** Check if potentialDescendantId is a descendant of ancestorId */
  isDescendant(ancestorId: string, potentialDescendantId: string): boolean {
    if (ancestorId === potentialDescendantId) return true
    let currentId: string | null = potentialDescendantId
    const visited = new Set<string>()
    while (currentId) {
      if (currentId === ancestorId) return true
      if (visited.has(currentId)) break
      visited.add(currentId)
      const row = db.select({ parentTaskId: tasks.parentTaskId }).from(tasks).where(eq(tasks.id, currentId)).get()
      currentId = row?.parentTaskId ?? null
    }
    return false
  }

  /** Renormalize sort orders of sibling tasks with 1000 spacing */
  renormalizeSortOrders(parentTaskId: string | null = null, projectId: string | null = null): void {
    const conditions = []
    if (parentTaskId) {
      conditions.push(eq(tasks.parentTaskId, parentTaskId))
    } else {
      conditions.push(isNull(tasks.parentTaskId))
    }
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId))
    }

    const siblings = db
      .select({ id: tasks.id, sortOrder: tasks.sortOrder })
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.sortOrder), desc(tasks.createdAt))
      .all()

    const now = new Date().toISOString()
    siblings.forEach((s, idx) => {
      const newOrder = (siblings.length - idx) * 1000
      db.update(tasks)
        .set({ sortOrder: newOrder, updatedAt: now })
        .where(eq(tasks.id, s.id))
        .run()
    })
    logger.info(`Renormalized sort orders for ${siblings.length} tasks`)
  }

  /** Reorder a single task with fractional ordering and persistence */
  reorderTask(input: ReorderTaskInput): Task {
    const task = this.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    let newSortOrder = input.targetSortOrder

    if (newSortOrder === undefined) {
      let beforeOrder: number | null = null
      let afterOrder: number | null = null

      if (input.beforeTaskId) {
        const beforeRow = db.select({ sortOrder: tasks.sortOrder }).from(tasks).where(eq(tasks.id, input.beforeTaskId)).get()
        if (beforeRow) beforeOrder = beforeRow.sortOrder ?? 0
      }
      if (input.afterTaskId) {
        const afterRow = db.select({ sortOrder: tasks.sortOrder }).from(tasks).where(eq(tasks.id, input.afterTaskId)).get()
        if (afterRow) afterOrder = afterRow.sortOrder ?? 0
      }

      if (beforeOrder !== null && afterOrder !== null) {
        if (Math.abs(beforeOrder - afterOrder) < 1) {
          this.renormalizeSortOrders(input.parentTaskId ?? task.parentTaskId, input.projectId ?? task.projectId)
          const bRow = db.select({ sortOrder: tasks.sortOrder }).from(tasks).where(eq(tasks.id, input.beforeTaskId!)).get()
          const aRow = db.select({ sortOrder: tasks.sortOrder }).from(tasks).where(eq(tasks.id, input.afterTaskId!)).get()
          beforeOrder = bRow?.sortOrder ?? 0
          afterOrder = aRow?.sortOrder ?? 0
        }
        newSortOrder = Math.round((beforeOrder + afterOrder) / 2)
      } else if (beforeOrder !== null) {
        // Place after beforeTask (lower in sortOrder)
        newSortOrder = beforeOrder - 1000
      } else if (afterOrder !== null) {
        // Place before afterTask (higher in sortOrder)
        newSortOrder = afterOrder + 1000
      } else {
        newSortOrder = 1000
      }
    }

    const updateData: UpdateTaskInput = {
      sortOrder: newSortOrder
    }
    if (input.parentTaskId !== undefined) {
      updateData.parentTaskId = input.parentTaskId
    }
    if (input.projectId !== undefined) {
      updateData.projectId = input.projectId
    }

    return this.update(input.taskId, updateData)
  }

  /** Move a task to a different project */
  move(input: MoveTaskInput): Task {
    const task = this.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    // Get max sort order in target project
    const maxRow = db
      .select({ maxOrder: tasks.sortOrder })
      .from(tasks)
      .where(input.targetProjectId ? eq(tasks.projectId, input.targetProjectId) : isNull(tasks.projectId))
      .orderBy(desc(tasks.sortOrder))
      .limit(1)
      .get()

    const newSortOrder = (maxRow?.maxOrder ?? 0) + 1000

    return this.update(input.taskId, {
      projectId: input.targetProjectId,
      parentTaskId: null,
      sortOrder: newSortOrder
    })
  }

  /** Change a task's status */
  changeStatus(input: ChangeTaskStatusInput): Task {
    const task = this.get(input.taskId)
    if (!task) throw new Error(`Task not found: ${input.taskId}`)

    const stage = stageService.get(input.status)
    const isTargetCompleted = input.status === 'completed' || Boolean(stage?.isCompleted)

    if (isTargetCompleted) {
      return this.complete(input.taskId)
    }

    if (task.completedAt) {
      this.uncomplete(input.taskId)
    }

    return this.update(input.taskId, { status: input.status, completedAt: null })
  }

  /** Make a task a subtask of another task, preventing circular hierarchies */
  makeSubtask(input: MakeSubtaskInput): Task {
    if (input.taskId === input.parentTaskId) {
      throw new Error('Cannot make a task a subtask of itself')
    }

    if (this.isDescendant(input.taskId, input.parentTaskId)) {
      throw new Error('Cannot create circular task hierarchy')
    }

    const parent = this.get(input.parentTaskId)
    if (!parent) throw new Error(`Parent task not found: ${input.parentTaskId}`)

    // Get max sort order among siblings
    const maxRow = db
      .select({ maxOrder: tasks.sortOrder })
      .from(tasks)
      .where(eq(tasks.parentTaskId, input.parentTaskId))
      .orderBy(desc(tasks.sortOrder))
      .limit(1)
      .get()

    const newSortOrder = (maxRow?.maxOrder ?? 0) + 1000

    return this.update(input.taskId, {
      parentTaskId: input.parentTaskId,
      projectId: parent.projectId,
      sortOrder: newSortOrder
    })
  }

  /** Reorder tasks (legacy array format) */
  reorder(ids: string[]): void {
    const now = new Date().toISOString()
    ids.forEach((id, index) => {
      db.update(tasks)
        .set({ sortOrder: (ids.length - index) * 1000, updatedAt: now })
        .where(eq(tasks.id, id))
        .run()
    })
    logger.info(`Reordered ${ids.length} tasks`)
  }

  /** Get subtasks of a parent task */
  getSubtasks(parentId: string): Task[] {
    const rows = db
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, parentId))
      .orderBy(desc(tasks.sortOrder), desc(tasks.createdAt))
      .all()
    return rows.map(r => this.mapTask(r))
  }

  /** Get task statistics */
  getStats(): TaskStats {
    const today = new Date().toISOString().split('T')[0]
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const allTasks = db
      .select()
      .from(tasks)
      .where(isNull(tasks.parentTaskId))
      .all()

    const stats: TaskStats = {
      total: 0,
      active: 0,
      completed: 0,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      withReminders: 0
    }

    for (const task of allTasks) {
      stats.total++

      if (task.status === 'completed') {
        stats.completed++
      } else if (task.status === 'active') {
        stats.active++

        if (task.dueDate) {
          if (task.dueDate < today) {
            stats.overdue++
          } else if (task.dueDate === today) {
            stats.dueToday++
          }
          if (task.dueDate <= weekEndStr) {
            stats.dueThisWeek++
          }
        }

        if (task.reminderEnabled) {
          stats.withReminders++
        }
      }
    }

    return stats
  }

  /** Search tasks by title and description */
  search(query: string): Task[] {
    if (!query.trim()) return []

    const searchTerm = `%${query.trim()}%`
    const rows = db
      .select()
      .from(tasks)
      .where(
        or(
          like(tasks.title, searchTerm),
          like(tasks.description, searchTerm)
        )
      )
      .orderBy(desc(tasks.createdAt))
      .limit(50)
      .all()
    return rows.map(r => this.mapTask(r))
  }
}

export const taskService = new TaskService()
