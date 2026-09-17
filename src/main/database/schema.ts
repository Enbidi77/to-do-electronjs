import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  priority: text('priority').default('none'),
  projectId: text('project_id'), // Self FK not explicitly mapped in basic sqliteTable without extra config
  parentTaskId: text('parent_task_id'),
  dueDate: text('due_date'),
  dueTime: text('due_time'),
  reminderEnabled: integer('reminder_enabled').default(0),
  reminderTime: text('reminder_time'),
  recurrenceRule: text('recurrence_rule'),
  completedAt: text('completed_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  archivedAt: text('archived_at'),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  statusIdx: index('tasks_status_idx').on(table.status),
  projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
  parentTaskIdIdx: index('tasks_parent_task_id_idx').on(table.parentTaskId),
  completedAtIdx: index('tasks_completed_at_idx').on(table.completedAt),
  sortOrderIdx: index('tasks_sort_order_idx').on(table.sortOrder),
}));

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3b82f6'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').default('#3b82f6'),
  createdAt: text('created_at'),
});

export const taskTags = sqliteTable('task_tags', {
  taskId: text('task_id').notNull(),
  tagId: text('tag_id').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.tagId] }),
  taskIdIdx: index('task_tags_task_id_idx').on(table.taskId),
  tagIdIdx: index('task_tags_tag_id_idx').on(table.tagId),
}));

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id'),
  scheduledAt: text('scheduled_at').notNull(),
  notificationTitle: text('notification_title').notNull(),
  notificationBody: text('notification_body'),
  enabled: integer('enabled').default(1),
  firedAt: text('fired_at'),
  snoozedUntil: text('snoozed_until'),
  createdAt: text('created_at'),
}, (table) => ({
  scheduledAtIdx: index('reminders_scheduled_at_idx').on(table.scheduledAt),
  enabledIdx: index('reminders_enabled_idx').on(table.enabled),
}));

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
}, (table) => ({
  keyIdx: index('settings_key_idx').on(table.key),
}));

export const stages = sqliteTable('stages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').default('#64748b'),
  icon: text('icon').default('circle'),
  sortOrder: integer('sort_order').default(0),
  isCompleted: integer('is_completed').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
}, (table) => ({
  sortOrderIdx: index('stages_sort_order_idx').on(table.sortOrder),
}));
