import { db } from '../database/connection';
import { reminders } from '../database/schema';
import { eq, desc, and, isNull, lte } from 'drizzle-orm';
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
}

export const reminderService = new ReminderService();
