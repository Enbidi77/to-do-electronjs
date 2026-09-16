import { dialog } from 'electron';
import fs from 'fs';
import type { ExportOptions, ImportResult } from '@shared/types';
import { taskService } from './task-service';
import { projectService } from './project-service';
import { tagService } from './tag-service';
import { backupService } from './backup-service';
import { db } from '../database/connection';
import { tasks, projects, tags } from '../database/schema';
import { createLogger } from '../system/logger';

const logger = createLogger('ExportService');

export class ExportService {
  async exportJSON(options: ExportOptions): Promise<string> {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Data',
      defaultPath: 'todo-backup.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (!filePath) return '';

    const allTasks = taskService.list();
    const allProjects = projectService.list();
    const allTags = tagService.list();

    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projects: allProjects,
      tags: allTags,
      tasks: allTasks.filter(t => {
        if (!options.includeCompleted && t.status === 'completed') return false;
        if (!options.includeArchived && t.status === 'archived') return false;
        return true;
      }),
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Exported data to JSON at ${filePath}`);
    return filePath;
  }

  async exportCSV(options: ExportOptions): Promise<string> {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Data',
      defaultPath: 'todo-tasks.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (!filePath) return '';

    const allTasks = taskService.list().filter(t => {
      if (!options.includeCompleted && t.status === 'completed') return false;
      if (!options.includeArchived && t.status === 'archived') return false;
      return true;
    });

    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'DueDate', 'DueTime', 'CreatedAt'];
    const rows = allTasks.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate || '',
      t.dueTime || '',
      t.createdAt
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    fs.writeFileSync(filePath, csvContent, 'utf-8');
    logger.info(`Exported data to CSV at ${filePath}`);
    return filePath;
  }

  async importJSON(filePath?: string): Promise<ImportResult> {
    const result: ImportResult = {
      tasksImported: 0,
      projectsImported: 0,
      tagsImported: 0,
      errors: []
    };

    let importPath = filePath;
    if (!importPath) {
      const { filePaths } = await dialog.showOpenDialog({
        title: 'Import Data',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      });
      if (!filePaths || filePaths.length === 0) {
        result.errors.push('No file selected');
        return result;
      }
      importPath = filePaths[0];
    }

    try {
      // Auto-create backup before importing
      backupService.createBackup();

      const content = fs.readFileSync(importPath, 'utf8');
      const data = JSON.parse(content);

      // Import projects
      if (Array.isArray(data.projects)) {
        for (const proj of data.projects) {
          try {
            if (proj.id && proj.name) {
              db.insert(projects)
                .values({
                  id: proj.id,
                  name: proj.name,
                  description: proj.description || null,
                  color: proj.color || '#3b82f6',
                  icon: proj.icon || null,
                  sortOrder: proj.sortOrder || 0,
                  createdAt: proj.createdAt || new Date().toISOString(),
                  updatedAt: proj.updatedAt || new Date().toISOString()
                })
                .onConflictDoNothing()
                .run();
              result.projectsImported++;
            }
          } catch (pErr) {
            result.errors.push(`Failed to import project ${proj.name}: ${pErr}`);
          }
        }
      }

      // Import tags
      if (Array.isArray(data.tags)) {
        for (const tag of data.tags) {
          try {
            if (tag.id && tag.name) {
              db.insert(tags)
                .values({
                  id: tag.id,
                  name: tag.name,
                  color: tag.color || '#3b82f6',
                  createdAt: tag.createdAt || new Date().toISOString()
                })
                .onConflictDoNothing()
                .run();
              result.tagsImported++;
            }
          } catch (tErr) {
            result.errors.push(`Failed to import tag ${tag.name}: ${tErr}`);
          }
        }
      }

      // Import tasks
      if (Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          try {
            if (task.id && task.title) {
              db.insert(tasks)
                .values({
                  id: task.id,
                  title: task.title,
                  description: task.description || null,
                  status: task.status || 'active',
                  priority: task.priority || 'none',
                  projectId: task.projectId || null,
                  parentTaskId: task.parentTaskId || null,
                  dueDate: task.dueDate || null,
                  dueTime: task.dueTime || null,
                  reminderEnabled: task.reminderEnabled ? 1 : 0,
                  reminderTime: task.reminderTime || null,
                  recurrenceRule: task.recurrenceRule || null,
                  completedAt: task.completedAt || null,
                  createdAt: task.createdAt || new Date().toISOString(),
                  updatedAt: task.updatedAt || new Date().toISOString(),
                  archivedAt: task.archivedAt || null,
                  sortOrder: task.sortOrder || 0
                })
                .onConflictDoNothing()
                .run();
              result.tasksImported++;
            }
          } catch (taskErr) {
            result.errors.push(`Failed to import task ${task.title}: ${taskErr}`);
          }
        }
      }

      logger.info(`Import completed: ${result.tasksImported} tasks, ${result.projectsImported} projects, ${result.tagsImported} tags`);
      return result;
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
      return result;
    }
  }
}

export const exportService = new ExportService();
