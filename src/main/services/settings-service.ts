import { db } from '../database/connection';
import { settings as settingsTable } from '../database/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { AppSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';

export class SettingsService {
  getAll(): AppSettings {
    const rows = db.select().from(settingsTable).all();
    const dbSettings: Partial<AppSettings> = {};
    
    rows.forEach(row => {
      try {
        dbSettings[row.key as keyof AppSettings] = JSON.parse(row.value || 'null');
      } catch (e) {
        // fallback to null
      }
    });

    return { ...DEFAULT_SETTINGS, ...dbSettings };
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const row = db.select().from(settingsTable).where(eq(settingsTable.key, key)).get();
    if (!row || !row.value) return DEFAULT_SETTINGS[key];
    try {
      return JSON.parse(row.value) as AppSettings[K];
    } catch {
      return DEFAULT_SETTINGS[key];
    }
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const row = db.select().from(settingsTable).where(eq(settingsTable.key, key)).get();
    const jsonValue = JSON.stringify(value);
    
    if (row) {
      db.update(settingsTable).set({ value: jsonValue }).where(eq(settingsTable.key, key)).run();
    } else {
      db.insert(settingsTable).values({ id: nanoid(), key, value: jsonValue }).run();
    }
  }

  reset(): void {
    db.delete(settingsTable).run();
  }
}

export const settingsService = new SettingsService();
