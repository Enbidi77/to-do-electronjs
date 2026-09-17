# Application Startup Lifecycle & Splash Screen

This document details the startup sequence, splash screen window lifecycle, error handling, IPC architecture, and theme management in the Todo application.

---

## 1. Startup Philosophy

Desktop applications should feel intentional, responsive, and reliable from the moment they are launched. Rather than showing a blank, unstyled window while native modules, database schemas, and background services initialize, the application displays a lightweight, borderless Windows 11-inspired splash screen.

Key principles:
* **Intentional display duration**: A balanced minimum display time (`MIN_SPLASH_DURATION_MS = 1200ms`) ensures the splash screen is clearly visible and readable, avoiding jarring instant flashes on high-speed hardware while still transitioning smoothly as soon as the app is ready.
* **Anti-white flash**: The initial window background color dynamically matches the OS or user preference (`#1f2023` for dark, `#f8fafc` for light) before HTML rendering begins.
* **Informative progress**: Real initialization phases are reflected rather than manufactured percentage bars.
* **Resilient error handling**: Startup failures (such as SQLite connection or migration issues) keep the splash screen visible, display human-readable guidance, and provide idempotent **Retry** and **Quit** options.

---

## 2. Startup Architecture & Sequence

```text
Electron Process Launches
         │
         ▼
 ┌───────────────┐
 │ Splash Window │ ◄── 420x280 borderless, centered, always-on-top
 └───────┬───────┘
         │
         ▼
 ┌────────────────────────────────────────┐
 │      StartupCoordinator (Main)         │
 ├────────────────────────────────────────┤
 │ 1. Register IPC handlers idempotently  │
 │ 2. Phase 'database': SQLite & migrator │
 │ 3. Phase 'settings': Preferences       │
 │ 4. Phase 'scheduler': Reminders & tray │
 │ 5. Phase 'window': Create MainWindow   │
 └───────────────────┬────────────────────┘
                     │
                     ▼
           ┌───────────────────┐
           │ Main Window Ready │ (hidden until ready-to-show)
           └─────────┬─────────┘
                     │
                     ▼
           ┌───────────────────┐
           │ Handoff & Fade    │ (~150ms smooth transition)
           ├───────────────────┤
           │ Show MainWindow   │
           │ Destroy Splash    │
           └───────────────────┘
```

### Detailed Execution Steps:
1. **Single Instance Check**: `app.requestSingleInstanceLock()` ensures only one instance runs. Second instances focus the existing main window.
2. **IPC Early Registration**: `registerAllIpcHandlers()` registers all channels including `startup:getState`, `startup:retry`, and `startup:quit`. Guarded by an idempotency flag to prevent duplicate listener errors on retry.
3. **Splash Window Creation**: A lightweight 420x280 frameless `BrowserWindow` is created with `contextIsolation: true` and `nodeIntegration: false`. It loads `#/splash`.
4. **Database & Migrations**: `initializeDatabase()` initializes the SQLite database connection, sets WAL journal mode, applies Drizzle migrations, and ensures default stage configurations.
5. **Settings & Localization**: Reads saved user preferences. Detects system locale (`app.getLocale()`) as fallback.
6. **Reminder Scheduler**: `ReminderScheduler` singleton starts ticking, `NotificationService` binds, and system power monitor initializes.
7. **System Tray**: `createTrayManager` binds tray icon, context menu, and tooltip to the main window lifecycle.
8. **Main Window Readiness**: `createMainWindow(false)` initializes the primary UI hidden. Once `ready-to-show` fires, `transitionFromSplash` smoothly fades the splash window and reveals the main workspace.

---

## 3. Splash Screen Appearance & Design

| Theme | Background | Text / Secondary | Accents |
| :--- | :--- | :--- | :--- |
| **Dark** | Deep charcoal (`#1f2023`, `bg-background`) | High-contrast white (`text-foreground`) / Muted grey (`text-muted-foreground`) | Restrained blue (`text-primary`, `bg-primary`) |
| **Light** | Clean soft neutral (`#f8fafc`) | Dark charcoal (`text-foreground`) / Slate grey (`text-muted-foreground`) | Primary blue |
| **System** | Evaluated via `nativeTheme.shouldUseDarkColors` before window creation to eliminate flash. |

### Visual Elements:
* **App Icon**: 48x48 rounded card housing the crisp application icon (`icon.png`).
* **Title**: `Todo` (or dynamic `APP_NAME`).
* **Subtitle**: Localized tagline ("Your personal workspace" / "Không gian làm việc của bạn").
* **Progress Indicator**: Small spinning indicator (`Loader2`) paired with an indeterminate progress line and user-friendly status message.
* **Version**: Dynamically read from application package metadata (`app.getVersion()`).

---

## 4. Error Handling & Retry Mechanics

If an error occurs at any point (e.g. SQLite database locked, migration failed, disk full):

1. Normal startup halts immediately without opening a broken main window.
2. The splash window remains visible and switches to the **Error State**.
3. A friendly, non-technical explanation is shown to the user (e.g. "Could not connect to or initialize the workspace database. Please check disk access and retry.").
4. The full technical stack trace is safely recorded to the main process logger (`app.log`).
5. Two action buttons are presented:
   * **Retry**: Invokes `startup:retry` via IPC. `StartupCoordinator` cleanly tears down partially initialized instances (stops schedulers, closes database, destroys incomplete windows) and re-executes startup safely.
   * **Quit**: Invokes `startup:quit` via IPC to cleanly exit the application.

---

## 5. IPC Interface

Communication between the splash UI and the main process occurs strictly over secure IPC via `window.api.startup` and `window.todo.startup`:

```typescript
export interface StartupState {
  phase: StartupPhase
  message?: string
  error?: string | null
  version: string
  appName: string
  theme: 'light' | 'dark' | 'system'
  systemIsDark: boolean
  language: 'en' | 'vi'
}

export interface StartupApi {
  getState(): Promise<StartupState>
  retry(): Promise<void>
  quit(): Promise<void>
  onStatusChange(callback: (state: StartupState) => void): () => void
}
```

---

## 6. Environment Behavior

### Development Mode (`npm run dev`)
* Splash window loads from Vite dev server: `${ELECTRON_RENDERER_URL}#/splash`.
* Hot Module Replacement (HMR) operates as normal.
* Main window loads `${ELECTRON_RENDERER_URL}`.

### Production Packaging (`npm run build` / `npm run build:win`)
* Splash window loads bundled asset: `out/renderer/index.html#splash`.
* Main window loads `out/renderer/index.html`.
* Resources (`icon.ico`, `drizzle/` migrations) resolve from `process.resourcesPath`.
