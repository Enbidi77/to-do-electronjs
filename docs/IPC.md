# IPC Communication

The IPC (Inter-Process Communication) bridge is strictly typed and managed.

## Channel Naming Convention

All channels are defined in `src/shared/types/ipc.ts` using an enum or a const object.
Format: `CATEGORY:ACTION` (e.g., `tasks:create`).

## Security

- The renderer process NEVER sends raw SQL queries over IPC.
- The renderer process NEVER sends file paths for the main process to execute.
- All IPC handlers validate arguments.

## Error Handling Pattern

Main process handlers catch errors and throw sanitized Error objects. The preload script bridge transparently passes these rejected promises to the renderer, where they can be caught and displayed (e.g., via a toast).

## Adding New Channels

1. Add the channel string to `IPC_CHANNELS` in `src/shared/types/ipc.ts`.
2. Define request/response types in `@shared/types`.
3. Add the `ipcMain.handle` logic in the main process.
4. Expose the API method in `src/preload/index.ts`.
