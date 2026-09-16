import { reminderService } from '../services/reminder-service';
import { NotificationService } from '../notifications/notification-service';
import { SettingsService } from '../services/settings-service';
import { createLogger } from '../system/logger';

const logger = createLogger('Scheduler');
const SCHEDULER_TICK_INTERVAL_MS = 30000;

export class ReminderScheduler {
  private static instance: ReminderScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private settingsService = new SettingsService();

  public static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler();
    }
    return ReminderScheduler.instance;
  }

  start(): void {
    if (this.intervalId) {
      logger.warn('Scheduler already running');
      return;
    }
    
    logger.info('Starting reminder scheduler');
    // Ensure reminders are synced for all active tasks with due dates
    try {
      reminderService.syncAllTaskReminders();
    } catch (err) {
      logger.error('Failed to sync task reminders on startup', err);
    }

    this.tick(); // Initial tick
    this.intervalId = setInterval(() => this.tick(), SCHEDULER_TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      logger.info('Stopping reminder scheduler');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  tick(): void {
    try {
      const settings = this.settingsService.getAll();
      if (!settings.notificationsEnabled) {
        return;
      }

      const overdueReminders = reminderService.getOverdue();
      
      if (overdueReminders.length > 0) {
        logger.info(`Found ${overdueReminders.length} overdue reminders`);
      }

      for (const reminder of overdueReminders) {
        const isPastDue = new Date(reminder.scheduledAt).getTime() < Date.now();
        if (!settings.showOverdueReminders && isPastDue) {
          reminderService.markFired(reminder.id);
          continue;
        }

        NotificationService.getInstance().showReminder(reminder);
        reminderService.markFired(reminder.id);
      }
    } catch (error) {
      logger.error('Error during scheduler tick', error);
    }
  }

  onResume(): void {
    logger.info('System wake detected, running immediate tick');
    this.tick();
  }

  reschedule(): void {
    logger.info('Rescheduling reminders');
    // Currently relying on the tick loop. In a more complex system, this would reload cron jobs or in-memory timers.
  }
}

export const reminderScheduler = new ReminderScheduler();
