import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import { taskService } from '../services/task-service';
import { createLogger } from '../system/logger';

const logger = createLogger('Tray');

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create(): void {
    // Basic 16x16 transparent image with checkmark
    const iconData = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNOS41IDEybS0uNS0uNmw1LTUuNWwtLjgtLjdMNiA5LjVMMy4zIDYuOGwtLjcuOEw2IDExbDQuNS00eiIvPjwvc3ZnPg==';
    const icon = nativeImage.createFromDataURL(iconData);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('Todo App');
    
    this.tray.on('double-click', () => {
      this.showApp();
    });

    this.updateContextMenu();
    this.updateTooltip();
  }

  updateContextMenu(): void {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => this.showApp() },
      { label: 'Quick Add', click: () => this.showQuickAdd() },
      { type: 'separator' },
      { label: "Today's Tasks", click: () => this.showApp() },
      { label: 'Upcoming', click: () => this.showApp() },
      { type: 'separator' },
      { label: 'Pause Notifications', type: 'checkbox', checked: false, click: () => this.toggleNotifications() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    this.tray.setContextMenu(contextMenu);
  }

  updateTooltip(): void {
    if (!this.tray) return;
    try {
      const stats = taskService.getStats();
      this.tray.setToolTip(`Todo App\n${stats.overdue} overdue, ${stats.active} active`);
    } catch (e) {
      logger.warn('Failed to update tray tooltip', e);
    }
  }

  private showApp(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private showQuickAdd(): void {
    // Communicate with app to show quick add
    if (this.mainWindow) {
      this.mainWindow.webContents.send('show-quick-add');
    }
  }

  private toggleNotifications(): void {
    logger.info('Toggled notifications from tray');
    // Implementation would hook into settingsService
  }
}

export function createTrayManager(mainWindow: BrowserWindow): TrayManager {
  const manager = new TrayManager(mainWindow);
  manager.create();
  return manager;
}
