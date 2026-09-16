# Database Documentation

The application uses an embedded SQLite database managed by `better-sqlite3` and `Drizzle ORM`.

## Schema

### `tasks` table
- `id` (text, primary key)
- `title` (text, required)
- `description` (text)
- `status` (text: 'todo', 'in_progress', 'completed')
- `priority` (integer: 1=low, 2=medium, 3=high)
- `dueDate` (text, ISO 8601 date)
- `projectId` (text, foreign key)
- `createdAt` (text)
- `updatedAt` (text)

### `projects` table
- `id` (text, primary key)
- `name` (text, required)
- `color` (text)

### `tags` table
- `id` (text, primary key)
- `name` (text, required)
- `color` (text)

### `task_tags` table
- `taskId` (text, foreign key)
- `tagId` (text, foreign key)
- Primary key is `(taskId, tagId)`

### `reminders` table
- `id` (text, primary key)
- `taskId` (text, foreign key)
- `remindAt` (text, ISO 8601 timestamp)
- `fired` (integer boolean)

## Indexes

- `tasks(dueDate)` - Fast querying of upcoming tasks.
- `tasks(status)` - Fast filtering by completion status.
- `tasks(projectId)` - Fast filtering by project.

## Relationships

- Task belongs to Project (1:N)
- Task has many Tags (N:M)
- Task has many Reminders (1:N)

## Migrations

Migrations are handled by Drizzle. The main process runs migrations on startup before the renderer loads.

## Backup Strategy

The database file is stored in `app.getPath('userData')`. A simple file copy is sufficient for backups.

## Performance Considerations

- Use `WAL` journal mode for better concurrency.
- Run `PRAGMA optimize` periodically.
