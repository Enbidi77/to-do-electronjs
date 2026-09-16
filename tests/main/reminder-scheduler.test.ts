import { describe, it, expect, beforeAll, vi } from 'vitest'
import { initializeDatabase } from '../../src/main/database/connection'
import { ReminderService } from '../../src/main/services/reminder-service'
import { ReminderScheduler } from '../../src/main/scheduler/reminder-scheduler'
import { NotificationService } from '../../src/main/notifications/notification-service'
import { TaskService } from '../../src/main/services/task-service'

describe('ReminderScheduler', () => {
  let reminderService: ReminderService
  let scheduler: ReminderScheduler
  let taskService: TaskService

  beforeAll(() => {
    initializeDatabase(':memory:')
    reminderService = new ReminderService()
    taskService = new TaskService()
    scheduler = ReminderScheduler.getInstance()
  })

  it('should fire due reminders and avoid future ones', () => {
    const task = taskService.create({ title: 'Task with reminder' })

    const showReminderSpy = vi.spyOn(
      NotificationService.getInstance(),
      'showReminder'
    ).mockImplementation(() => {})

    // Due reminder (past date)
    const pastReminder = reminderService.create({
      taskId: task.id,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
      notificationTitle: 'Past Due Task'
    })

    // Future reminder (future date)
    const futureReminder = reminderService.create({
      taskId: task.id,
      scheduledAt: new Date(Date.now() + 600000).toISOString(),
      notificationTitle: 'Future Task'
    })

    // Execute scheduler tick
    scheduler.tick()

    expect(showReminderSpy).toHaveBeenCalled()
    const firedIds = showReminderSpy.mock.calls.map(call => call[0].id)
    expect(firedIds).toContain(pastReminder.id)
    expect(firedIds).not.toContain(futureReminder.id)

    showReminderSpy.mockRestore()
  })

  it('should mark fired reminders so they are not fired again on subsequent ticks', () => {
    const task = taskService.create({ title: 'One-off reminder task' })
    const showReminderSpy = vi.spyOn(
      NotificationService.getInstance(),
      'showReminder'
    ).mockImplementation(() => {})

    const reminder = reminderService.create({
      taskId: task.id,
      scheduledAt: new Date(Date.now() - 30000).toISOString(),
      notificationTitle: 'Single Fire Notification'
    })

    // First tick fires it
    scheduler.tick()
    expect(showReminderSpy).toHaveBeenCalledTimes(1)

    // Second tick must NOT fire it again
    scheduler.tick()
    expect(showReminderSpy).toHaveBeenCalledTimes(1)

    showReminderSpy.mockRestore()
  })

  it('should handle missed reminders on system resume', () => {
    const task = taskService.create({ title: 'Missed wake task' })
    const showReminderSpy = vi.spyOn(
      NotificationService.getInstance(),
      'showReminder'
    ).mockImplementation(() => {})

    reminderService.create({
      taskId: task.id,
      scheduledAt: new Date(Date.now() - 10000).toISOString(),
      notificationTitle: 'Wake notification'
    })

    scheduler.onResume()
    expect(showReminderSpy).toHaveBeenCalled()

    showReminderSpy.mockRestore()
  })
})
