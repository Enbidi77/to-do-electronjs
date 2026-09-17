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

    // Ensure stages table exists and seed defaults if empty
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS stages (
          id text PRIMARY KEY NOT NULL,
          name text NOT NULL,
          color text DEFAULT '#64748b',
          icon text DEFAULT 'circle',
          sort_order integer DEFAULT 0,
          is_completed integer DEFAULT 0,
          created_at text,
          updated_at text
        );
        CREATE INDEX IF NOT EXISTS stages_sort_order_idx ON stages (sort_order);
      `);

      const stageCount = (sqlite.prepare('SELECT COUNT(*) as count FROM stages').get() as { count: number })?.count ?? 0;
      if (stageCount === 0) {
        const now = new Date().toISOString();
        const insertStage = sqlite.prepare(`
          INSERT INTO stages (id, name, color, icon, sort_order, is_completed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertStage.run('active', 'To Do', '#94a3b8', 'circle', 1000, 0, now, now);
        insertStage.run('in_progress', 'In Progress', '#f59e0b', 'clock', 2000, 0, now, now);
        insertStage.run('completed', 'Done', '#10b981', 'check-circle-2', 3000, 1, now, now);
        logger.info('Default stages seeded successfully');
      }
    } catch (stageInitErr) {
      logger.error('Failed to ensure stages table or seed', stageInitErr);
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
}
