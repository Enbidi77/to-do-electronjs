import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'Database' | 'Scheduler' | 'Notification' | 'IPC' | 'Tray' | 'App' | 'TaskService' | 'ExportService' | string;

class Logger {
  private category: string;
  private isDebugEnabled: boolean = true;
  private logFilePath: string = '';

  constructor(category: LogCategory) {
    this.category = category;
    try {
      if (app && typeof app.getPath === 'function') {
        this.logFilePath = path.join(app.getPath('userData'), 'app.log');
      }
    } catch {
      this.logFilePath = '';
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level.toUpperCase()}] [${this.category}] ${message}`;
    if (meta !== undefined) {
      if (meta instanceof Error) {
        formatted += `\n${meta.stack || meta.message}`;
      } else {
        try {
          formatted += ` ${JSON.stringify(meta)}`;
        } catch {
          formatted += ` ${String(meta)}`;
        }
      }
    }
    return formatted;
  }

  private write(level: LogLevel, message: string, meta?: unknown) {
    if (level === 'debug' && !this.isDebugEnabled) return;

    const logString = this.formatMessage(level, message, meta);

    // Console output
    switch (level) {
      case 'debug': console.debug(logString); break;
      case 'info': console.info(logString); break;
      case 'warn': console.warn(logString); break;
      case 'error': console.error(logString); break;
    }

    // File output if file path is available
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logString + '\n');
      } catch {
        // Silently ignore logging write errors
      }
    }
  }

  debug(message: string, meta?: unknown) { this.write('debug', message, meta); }
  info(message: string, meta?: unknown) { this.write('info', message, meta); }
  warn(message: string, meta?: unknown) { this.write('warn', message, meta); }
  error(message: string, meta?: unknown) { this.write('error', message, meta); }
}

export function createLogger(category: LogCategory): Logger {
  return new Logger(category);
}
