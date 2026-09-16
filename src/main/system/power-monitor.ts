import { powerMonitor } from 'electron';
import { ReminderScheduler } from '../scheduler/reminder-scheduler';
import { createLogger } from '../system/logger';

const logger = createLogger('App');

export function initPowerMonitor(scheduler: ReminderScheduler): void {
  powerMonitor.on('resume', () => {
    logger.info('System resumed from sleep');
    scheduler.onResume();
  });

  powerMonitor.on('lock-screen', () => {
    logger.info('Screen locked');
  });

  powerMonitor.on('unlock-screen', () => {
    logger.info('Screen unlocked');
  });
}
