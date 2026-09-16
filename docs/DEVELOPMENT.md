# Development Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- Windows 10/11 (primary target)

## Setup Steps

1. Clone the repository.
2. Run `npm install` in the project root.
3. Ensure you have the C++ build tools installed for `better-sqlite3`.

## Running in Development

```bash
npm run dev
```

This starts:
1. Vite dev server for the renderer process.
2. TSC watch for the main process.
3. Electron executable pointing to the dev server.

## Hot Reload Behavior

- **Renderer Process**: Changes to React components will trigger Fast Refresh. The window will not reload.
- **Main Process**: Changes to main process files (services, database) will cause Electron to automatically restart.
- **Preload Script**: Changes require a full application restart.

## Debugging

- **Main Process**: You can attach a Node debugger to port 9222.
- **Renderer Process**: Use the standard Chrome DevTools (Ctrl+Shift+I).

## Adding a New Feature

1.  Define the API types in `src/shared/types/`.
2.  Add the IPC channel constant.
3.  Implement the database schema changes (if any) and run migrations.
4.  Create or update the service in `src/main/services/`.
5.  Add the `ipcMain.handle` listener in `src/main/ipc/`.
6.  Add the API wrapper in `src/preload/index.ts`.
7.  Create the UI components and hook up the Zustand store in `src/renderer/`.

## Adding New shadcn/ui Components

We use a customized implementation of shadcn/ui. To add a new component, you can use the CLI or manually copy the component from the registry to `src/renderer/src/components/ui`.
