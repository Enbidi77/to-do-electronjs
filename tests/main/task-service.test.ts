import { describe, it, expect, beforeAll } from 'vitest'
import { initializeDatabase } from '../../src/main/database/connection'
import { TaskService } from '../../src/main/services/task-service'

describe('TaskService', () => {
  let service: TaskService

  beforeAll(() => {
    // Initialize in-memory database with migrations
    initializeDatabase(':memory:')
    service = new TaskService()
  })

  it('should create a task', () => {
    const task = service.create({
      title: 'Complete financial report',
      description: 'Q3 budget analysis',
      priority: 'high',
      dueDate: '2026-09-20'
    })

    expect(task).toBeDefined()
    expect(task.id).toBeDefined()
    expect(task.title).toBe('Complete financial report')
    expect(task.priority).toBe('high')
    expect(task.status).toBe('active')
  })

  it('should update a task', () => {
    const task = service.create({ title: 'Task to update', priority: 'low' })
    const updated = service.update(task.id, {
      title: 'Task updated successfully',
      priority: 'urgent'
    })

    expect(updated.title).toBe('Task updated successfully')
    expect(updated.priority).toBe('urgent')
  })

  it('should complete and uncomplete a task', () => {
    const task = service.create({ title: 'Task to complete' })
    const completed = service.complete(task.id)

    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()

    const uncompleted = service.uncomplete(task.id)
    expect(uncompleted.status).toBe('active')
  })

  it('should handle recurring task completion by creating next occurrence', () => {
    // RRULE for daily recurrence
    const recurringTask = service.create({
      title: 'Daily Standup',
      recurrenceRule: 'FREQ=DAILY;INTERVAL=1',
      dueDate: '2026-09-16'
    })

    const completed = service.complete(recurringTask.id)
    expect(completed.status).toBe('completed')

    // Verify next recurrence was created
    const activeTasks = service.list({
      filter: { search: 'Daily Standup', status: 'active' }
    })
    expect(activeTasks.length).toBeGreaterThan(0)
    expect(activeTasks[0].title).toBe('Daily Standup')
  })

  it('should list tasks with filters and search', () => {
    service.create({ title: 'Alpha search target', priority: 'low' })
    service.create({ title: 'Beta item', priority: 'urgent' })

    const searchResults = service.search('Alpha')
    expect(searchResults.some(t => t.title.includes('Alpha'))).toBe(true)

    const urgentTasks = service.list({
      filter: { priority: 'urgent' }
    })
    expect(urgentTasks.some(t => t.priority === 'urgent')).toBe(true)
  })

  it('should compute task stats accurately', () => {
    const stats = service.getStats()
    expect(stats.total).toBeGreaterThan(0)
    expect(typeof stats.active).toBe('number')
    expect(typeof stats.completed).toBe('number')
  })

  it('should delete a task', () => {
    const task = service.create({ title: 'Task to be deleted' })
    service.delete(task.id)

    const retrieved = service.get(task.id)
    expect(retrieved).toBeNull()
  })
})
