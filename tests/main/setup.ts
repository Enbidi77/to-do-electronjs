import { vi } from 'vitest'

vi.mock('electron', () => {
  return {
    app: {
      isPackaged: false,
      getPath: vi.fn((name: string) => {
        if (name === 'userData') return process.cwd()
        return process.cwd()
      }),
      getVersion: () => '1.0.0',
      quit: vi.fn(),
      setLoginItemSettings: vi.fn(),
      requestSingleInstanceLock: vi.fn(() => true),
      on: vi.fn()
    },
    Notification: class {
      static isSupported() { return true }
      on() {}
      show() {}
    },
    BrowserWindow: class {
      isMinimized() { return false }
      restore() {}
      focus() {}
      show() {}
      hide() {}
      webContents = {
        send: vi.fn()
      }
    },
    Tray: class {
      setToolTip() {}
      setContextMenu() {}
      on() {}
    },
    Menu: {
      buildFromTemplate: vi.fn(() => ({}))
    },
    nativeImage: {
      createFromDataURL: vi.fn(() => ({}))
    },
    dialog: {
      showSaveDialog: vi.fn(),
      showOpenDialog: vi.fn()
    },
    shell: {
      openExternal: vi.fn()
    },
    ipcMain: {
      handle: vi.fn()
    }
  }
})

