import { Notification, BrowserWindow } from 'electron';
import { Reminder } from '@shared/types';
import { createLogger } from '../system/logger';

const logger = createLogger('Notification');

export class NotificationService {
  private static instance: NotificationService;
  private shownNotifications: Set<string> = new Set();
  private mainWindow: BrowserWindow | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  show(title: string, body: string, taskId?: string): void {
    if (!Notification.isSupported()) {
      logger.warn('Notifications are not supported on this system');
      return;
    }

    const notification = new Notification({
      title,
      body,
    });

    notification.on('click', () => {
      logger.info('Notification clicked', { taskId });
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
        if (taskId) {
          this.mainWindow.webContents.send('navigate-to-task', taskId);
        }
      }
    });

    notification.show();
  }

  showReminder(reminder: Reminder): void {
    // Prevent duplicate notification for same reminder fire event
    const notifKey = `${reminder.id}-${reminder.scheduledAt}`;
    if (this.shownNotifications.has(notifKey)) return;

    this.shownNotifications.add(notifKey);
    this.show(reminder.notificationTitle, reminder.notificationBody || '', reminder.taskId);
    
    // Clean up old keys to prevent memory leak
    if (this.shownNotifications.size > 1000) {
      const keys = Array.from(this.shownNotifications);
      this.shownNotifications.delete(keys[0]);
    }
  }
}

export const notificationService = NotificationService.getInstance();
