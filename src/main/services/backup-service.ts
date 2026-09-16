import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { BackupInfo } from '@shared/types';
import { createLogger } from '../system/logger';

const logger = createLogger('Database');

export class BackupService {
  private backupDir: string;
  private dbPath: string;

  constructor() {
    try {
      const userData = app ? app.getPath('userData') : process.cwd();
      this.backupDir = path.join(userData, 'backups');
      this.dbPath = app && app.isPackaged ? path.join(userData, 'todo.sqlite') : path.join(process.cwd(), 'dev.sqlite');
    } catch {
      this.backupDir = path.join(process.cwd(), 'backups');
      this.dbPath = path.join(process.cwd(), 'dev.sqlite');
    }

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  createBackup(): BackupInfo {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sqlite`;
    const destination = path.join(this.backupDir, filename);

    if (fs.existsSync(this.dbPath)) {
      fs.copyFileSync(this.dbPath, destination);
    } else {
      fs.writeFileSync(destination, '');
    }

    const stats = fs.statSync(destination);

    logger.info(`Created backup: ${filename}`);
    return {
      filename,
      path: destination,
      createdAt: new Date().toISOString(),
      size: stats.size,
    };
  }

  listBackups(): BackupInfo[] {
    if (!fs.existsSync(this.backupDir)) return [];
    const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.sqlite'));
    return files.map(file => {
      const fullPath = path.join(this.backupDir, file);
      const stats = fs.statSync(fullPath);
      return {
        filename: file,
        path: fullPath,
        createdAt: stats.birthtime.toISOString(),
        size: stats.size,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  restoreBackup(filename: string): void {
    const source = path.join(this.backupDir, filename);
    if (!fs.existsSync(source)) throw new Error('Backup not found');
    fs.copyFileSync(source, this.dbPath);
    logger.info(`Restored backup: ${filename}`);
  }

  cleanOldBackups(retentionDays: number): void {
    const backups = this.listBackups();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    backups.forEach(b => {
      if (new Date(b.createdAt) < cutoff) {
        fs.unlinkSync(b.path);
        logger.info(`Deleted old backup: ${b.filename}`);
      }
    });
  }
}

export const backupService = new BackupService();
