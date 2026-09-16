# Notification System

The application features a robust background reminder system.

## Architecture

- **`ReminderService`**: Handles database CRUD for reminders.
- **`ReminderScheduler`**: A tick-based scheduler that polls the database for due reminders.
- **Native Notifications**: Electron's `Notification` module is used to display OS-level alerts.

## Scheduler Design

The `ReminderScheduler` runs a lightweight tick every minute (or custom interval).
It queries the database for `reminders` where `remindAt <= now()` and `fired = 0`.

## Sleep/Wake Recovery

If the computer goes to sleep, `setInterval` pauses.
When the computer wakes, the scheduler immediately runs a check for all reminders missed during sleep.

## Duplicate Prevention

When a reminder fires, it is immediately marked as `fired = 1` in the database.
An in-memory Set of processing reminder IDs prevents double-firing if a tick overlaps.

## Snooze Implementation

Snoozing creates a new reminder for the same task in the future (or updates the current reminder's `remindAt` time and sets `fired = 0`).

## Limitations

- Reminders will not fire if the application is completely closed. The application should run in the system tray.
