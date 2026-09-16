# AI Agent Coding Rules

This document outlines strict coding conventions for AI agents and contributors working on this project.

### Architecture Rules
- **Security**: Never expose Node.js APIs (e.g., `fs`, `child_process`) directly to the renderer.
- **IPC Only**: All renderer-to-main communication must happen through `window.api`. All IPC channels are defined in `src/shared/types/ipc.ts`.
- **Logic Separation**: All business logic and database access MUST reside in the main process services. The renderer is for presentation and user interaction.

### Electron Security
- `contextIsolation: true` must always be used.
- `nodeIntegration: false` must always be used.
- Validate all IPC inputs inside the main process handlers.
- Never use `shell.openExternal` without strict URL validation.
- Never use `eval` or the `Function` constructor.

### React Conventions
- Use functional components and hooks only. No class components.
- Use **Zustand** for state management.
- Use **shadcn/ui** components. Do not reinvent the wheel for basic UI components.
- Use `React.memo` on list items to prevent unnecessary re-renders.
- Use `@tanstack/react-virtual` for lists that can grow large.
- Use **sonner** for toast notifications.

### TypeScript
- Strict mode is enabled. Absolutely no `any`.
- IPC types should be imported from `@shared/types`.
- Use type-only imports (`import type {}`) when possible.

### Database
- Use **Drizzle ORM**. Do not write raw SQL in services unless absolutely necessary and documented.
- Make all database modifications through the dedicated service layer.
- Use `nanoid` for generating primary keys.
- Store dates and times in ISO 8601 string format.

### Testing
- **Vitest** is used for all testing.
- Main process: Test services, the reminder scheduler, and search parsing logic.
- Renderer process: Use React Testing Library to test components and hooks.

### Performance
- Use virtual scrolling for lists over 100 items.
- Debounce search input by 300ms.
- Carefully design Zustand selectors to minimize React component re-renders.
