# Architecture

This document describes the architectural design of the Todo application.

## Process Model

Electron separates the application into distinct processes for security and stability:

1.  **Main Process**: Runs Node.js. It manages application lifecycle, native menus, window creation, SQLite database, file system access, and the background reminder scheduler.
2.  **Preload Script**: Runs in a specialized context before the renderer loads. It establishes a secure, typed IPC bridge.
3.  **Renderer Process**: Runs the Chromium browser environment. It hosts the React frontend. It cannot access Node.js directly.

## Security Boundary

```text
+-----------------------+           +-----------------------+           +-----------------------+
|   Renderer Process    |           |    Preload Script     |           |     Main Process      |
|   (React, Zustand)    | <-------> |   (contextBridge)     | <-------> | (SQLite, Node APIs)   |
|   No Node Access      | window.api|   Typed IPC Bridge    | ipcMain   |   Full Node Access    |
+-----------------------+           +-----------------------+           +-----------------------+
```

## Data Flow

1.  **Renderer**: User clicks "Save Task". Component calls `window.api.tasks.create(taskData)`.
2.  **Preload**: `ipcRenderer.invoke(IPC_CHANNELS.TASKS_CREATE, taskData)` sends a serialized message to the main process.
3.  **Main**: `ipcMain.handle` receives the message. It validates `taskData` and passes it to `TaskService`.
4.  **Service**: `TaskService` uses Drizzle ORM to insert data into SQLite.
5.  **Return**: The result is sent back across the IPC bridge to the renderer, where Zustand state is updated.

## Service Layer

The main process is structured around services:
-   `TaskService`: CRUD for tasks, searching, and filtering.
-   `ReminderService`: Manages reminder metadata.
-   `ProjectService` / `TagService`: Taxonomies for tasks.

## State Management

Zustand is used in the renderer. The store holds fetched data and optimistic updates. The main process serves as the source of truth.

## File Structure

-   `src/main/`: Main process code (services, database, IPC handlers).
-   `src/preload/`: Preload script establishing the context bridge.
-   `src/renderer/`: React frontend (components, hooks, store).
-   `src/shared/`: Types and constants shared between main and renderer.
