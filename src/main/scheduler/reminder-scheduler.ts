import { reminderService } from '../services/reminder-service';
import { NotificationService } from '../notifications/notification-service';
import { createLogger } from '../system/logger';

const logger = createLogger('Scheduler');
const SCHEDULER_TICK_INTERVAL_MS = 30000;

export class ReminderScheduler {
  private static instance: ReminderScheduler;
  private intervalId: NodeJS.Timeout | null = null;

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
      const overdueReminders = reminderService.getOverdue();
      
      if (overdueReminders.length > 0) {
        logger.info(`Found ${overdueReminders.length} overdue reminders`);
      }

      for (const reminder of overdueReminders) {
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
