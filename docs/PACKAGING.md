# Packaging

We use `electron-builder` to package the application.

## Build Commands

- `npm run build:win`: Builds the Windows `.exe` installer.
- `npm run build:mac`: Builds the macOS `.dmg`.
- `npm run build:linux`: Builds the Linux `.AppImage`.

## Configuration

Configuration is located in `electron-builder.yml` or `package.json`.

## NSIS Installer Options

We use NSIS for the Windows installer to support:
- One-click installation.
- Per-machine or per-user installation choices.
- Desktop shortcut creation.

## Native Modules

`better-sqlite3` is a native C++ module. `electron-builder` automatically rebuilds it against the correct Electron Node header versions during the package step.

## Auto-Update

Prepared for integration with `electron-updater`. GitHub releases will be used as the update server.
