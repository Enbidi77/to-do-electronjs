# Todo App

A fast, secure, and modern desktop task management application built with Electron, React, and Drizzle ORM.

![Screenshot placeholder](docs/assets/screenshot.png)

## Features

- **Task Management**: Create, update, delete, and organize tasks.
- **Projects & Tags**: Group tasks by projects and tag them for quick filtering.
- **Advanced Search**: Search using operators like `is:completed`, `priority:high`, `project:work`.
- **Smart Reminders**: Get notified when tasks are due with a reliable background scheduler.
- **Keyboard Driven**: Use shortcuts to navigate and manage tasks quickly.
- **Local First**: All data is stored locally in SQLite, ensuring privacy and speed.
- **Virtual Scrolling**: Smooth performance even with thousands of tasks.

## Tech Stack

| Component | Technology |
|---|---|
| Core | Electron, Node.js |
| Frontend | React, Vite, TypeScript |
| UI Framework | Tailwind CSS, shadcn/ui, Radix UI |
| State Management | Zustand |
| Database | SQLite (better-sqlite3), Drizzle ORM |
| Testing | Vitest, React Testing Library |

## Prerequisites

- Node.js 18+
- Windows 10/11 (macOS and Linux support experimental)

## Installation

```bash
git clone https://github.com/example/todo-app.git
cd todo-app
npm install
npm run dev
```

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:win` | Build Windows executable |
| `npm run test` | Run main process tests |
| `npm run test:renderer` | Run React component tests |
| `npm run lint` | Run ESLint |

## Architecture Summary

- **Main Process**: Handles window management, database access, and scheduling.
- **Preload Script**: Provides a secure IPC bridge via `contextBridge`.
- **Renderer Process**: Pure React application, communicates with main process via typed IPC.
- **Database**: Local SQLite database manipulated exclusively in the main process via Drizzle ORM.

## License

MIT License
