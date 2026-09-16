import { app } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { createLogger } from '../system/logger';

const logger = createLogger('Database');

let sqlite: Database.Database;
export let db: ReturnType<typeof drizzle<typeof schema>>;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function initializeDatabase(customPath?: string) {
  try {
    let dbPath = customPath;
    if (!dbPath) {
      try {
        dbPath = app && app.isPackaged 
          ? path.join(app.getPath('userData'), 'todo.sqlite')
          : path.join(process.cwd(), 'dev.sqlite');
      } catch {
        dbPath = path.join(process.cwd(), 'dev.sqlite');
      }
    }

    logger.info(`Initializing database at ${dbPath}`);
    
    sqlite = new Database(dbPath);
    if (dbPath !== ':memory:') {
      sqlite.pragma('journal_mode = WAL');
    }

    db = drizzle(sqlite, { schema });

    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    try {
      if (app && app.isPackaged) {
        const prodFolder = path.join(process.resourcesPath, 'drizzle');
        migrate(db, { migrationsFolder: prodFolder });
      } else {
        migrate(db, { migrationsFolder });
      }
    } catch (migErr) {
      logger.warn('Migration warning (continuing if tables exist)', migErr);
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
}
