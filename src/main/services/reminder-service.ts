import { db } from '../database/connection';
import { reminders, tasks } from '../database/schema';
import { eq, desc, and, isNull, isNotNull, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Reminder, CreateReminderInput, UpdateReminderInput, SnoozeDuration } from '@shared/types';

export class ReminderService {
  private mapReminder(row: typeof reminders.$inferSelect): Reminder {
    return {
      ...row,
      taskId: row.taskId || '',
      notificationBody: row.notificationBody || null,
      enabled: Boolean(row.enabled),
      firedAt: row.firedAt || null,
      snoozedUntil: row.snoozedUntil || null,
      createdAt: row.createdAt || new Date().toISOString()
    };
  }

  list(taskId?: string): Reminder[] {
    const query = db.select().from(reminders);
    if (taskId) {
      query.where(eq(reminders.taskId, taskId));
    }
    const rows = query.orderBy(desc(reminders.createdAt)).all();
    return rows.map(r => this.mapReminder(r));
  }

  get(id: string): Reminder | null {
    const row = db.select().from(reminders).where(eq(reminders.id, id)).get();
    if (!row) return null;
    return this.mapReminder(row);
  }

  create(input: CreateReminderInput): Reminder {
    const now = new Date().toISOString();
    const id = nanoid();
    const newReminder = {
      id,
      taskId: input.taskId,
      scheduledAt: input.scheduledAt,
      notificationTitle: input.notificationTitle,
      notificationBody: input.notificationBody || null,
      enabled: input.enabled !== false ? 1 : 0,
      firedAt: null,
      snoozedUntil: null,
      createdAt: now,
    };
    db.insert(reminders).values(newReminder).run();
    return this.get(id)!;
  }

  update(id: string, input: UpdateReminderInput): Reminder {
    const updateData: Record<string, unknown> = {};
    if (input.scheduledAt !== undefined) updateData.scheduledAt = input.scheduledAt;
    if (input.notificationTitle !== undefined) updateData.notificationTitle = input.notificationTitle;
    if (input.notificationBody !== undefined) updateData.notificationBody = input.notificationBody;
    if (input.enabled !== undefined) updateData.enabled = input.enabled ? 1 : 0;
    if (input.snoozedUntil !== undefined) updateData.snoozedUntil = input.snoozedUntil;

    db.update(reminders).set(updateData).where(eq(reminders.id, id)).run();
    return this.get(id)!;
  }

  delete(id: string): void {
    db.delete(reminders).where(eq(reminders.id, id)).run();
  }

  snooze(id: string, duration: SnoozeDuration): Reminder {
    const reminder = this.get(id);
    if (!reminder) throw new Error('Reminder not found');

    const now = new Date();
    const nextTime = new Date(now);

    if (duration === '5m') nextTime.setMinutes(nextTime.getMinutes() + 5);
    else if (duration === '10m') nextTime.setMinutes(nextTime.getMinutes() + 10);
    else if (duration === '30m') nextTime.setMinutes(nextTime.getMinutes() + 30);
    else if (duration === '1h') nextTime.setHours(nextTime.getHours() + 1);
    else if (duration === 'tomorrow') {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(9, 0, 0, 0);
    }

    const snoozedUntil = nextTime.toISOString();
    db.update(reminders)
      .set({ snoozedUntil, scheduledAt: snoozedUntil, firedAt: null })
      .where(eq(reminders.id, id))
      .run();

    return this.get(id)!;
  }

  getUpcoming(minutes: number = 60): Reminder[] {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const target = now.toISOString();

    const rows = db.select()
      .from(reminders)
      .where(and(eq(reminders.enabled, 1), lte(reminders.scheduledAt, target), isNull(reminders.firedAt)))
      .all();
    return rows.map(r => this.mapReminder(r));
  }

  getOverdue(): Reminder[] {
    const now = new Date().toISOString();
    const rows = db.select()
      .from(reminders)
      .where(and(eq(reminders.enabled, 1), lte(reminders.scheduledAt, now), isNull(reminders.firedAt)))
      .all();
    return rows.map(r => this.mapReminder(r));
  }

  markFired(id: string): void {
    db.update(reminders).set({ firedAt: new Date().toISOString() }).where(eq(reminders.id, id)).run();
  }

  deleteForTask(taskId: string): void {
    db.delete(reminders).where(eq(reminders.taskId, taskId)).run();
  }

  syncTaskReminder(task: {
    id: string;
    title: string;
    description?: string | null;
    status?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
  }): Reminder | null {
    // If task is not active or has no dueDate, remove any unfired reminders
    if (task.status !== 'active' || !task.dueDate) {
      db.delete(reminders)
        .where(and(eq(reminders.taskId, task.id), isNull(reminders.firedAt)))
        .run();
      return null;
    }

    // Compute scheduledAt from dueDate (YYYY-MM-DD) and dueTime (HH:mm)
    const [y, m, d] = task.dueDate.split('-').map(Number);
    let dateObj: Date;
    if (task.dueTime) {
      const [h, min] = task.dueTime.split(':').map(Number);
      dateObj = new Date(y, m - 1, d, h || 0, min || 0, 0);
    } else {
      // Default to 09:00 local time on the due date
      dateObj = new Date(y, m - 1, d, 9, 0, 0);
    }

    const scheduledAt = dateObj.toISOString();
    const bodyText = task.description
      ? `${task.description} (${task.dueDate})`
      : `Due: ${task.dueDate}`;

    // Check if a reminder already exists for this task
    const existing = db
      .select()
      .from(reminders)
      .where(eq(reminders.taskId, task.id))
      .get();

    if (existing) {
      const scheduledChanged = existing.scheduledAt !== scheduledAt;
      db.update(reminders)
        .set({
          scheduledAt,
          notificationTitle: task.title,
          notificationBody: bodyText,
          enabled: 1,
          firedAt: scheduledChanged ? null : existing.firedAt
        })
        .where(eq(reminders.id, existing.id))
        .run();
      return this.get(existing.id);
    } else {
      return this.create({
        taskId: task.id,
        scheduledAt,
        notificationTitle: task.title,
        notificationBody: bodyText,
        enabled: true
      });
    }
  }

  syncAllTaskReminders(): void {
    const activeTasksWithDueDate = db
      .select()
      .from(tasks)
      .where(and(eq(tasks.status, 'active'), isNotNull(tasks.dueDate)))
      .all();

    for (const task of activeTasksWithDueDate) {
      this.syncTaskReminder(task);
    }
  }
}

export const reminderService = new ReminderService();
