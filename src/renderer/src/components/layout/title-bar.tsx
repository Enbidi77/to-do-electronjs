import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X, Search, Plus, Sun, Moon, Settings as SettingsIcon, PanelLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'
import { useTheme } from '@/components/theme-provider'
import appIcon from '@/assets/icon.png'

export function TitleBar() {
  const { t } = useTranslation(['common', 'navigation', 'settings'])
  const [isMaximized, setIsMaximized] = useState(false)
  const toggleSidebar = useUiStore(s => s.toggleSidebar)
  const setSearchOpen = useUiStore(s => s.setSearchOpen)
  const setQuickAddOpen = useUiStore(s => s.setQuickAddOpen)
  const setView = useUiStore(s => s.setView)
  const currentView = useUiStore(s => s.currentView)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Check initial window maximized state
    const checkMaximized = async () => {
      try {
        if (window.todo?.window?.isMaximized) {
          const max = await window.todo.window.isMaximized()
          setIsMaximized(max)
        } else if (window.api?.window?.isMaximized) {
          const max = await window.api.window.isMaximized()
          setIsMaximized(max)
        }
      } catch {
        // ignore in mock / web environment
      }
    }

    checkMaximized()

    // Listen to maximize state changes from main process
    let cleanup: (() => void) | undefined
    if (window.todo?.window?.onMaximizeChanged) {
      cleanup = window.todo.window.onMaximizeChanged((maximized: boolean) => {
        setIsMaximized(maximized)
      })
    } else if (window.api?.window?.onMaximizeChanged) {
      cleanup = window.api.window.onMaximizeChanged((maximized: boolean) => {
        setIsMaximized(maximized)
      })
    } else if (window.api?.on?.windowMaximizeChanged) {
      cleanup = window.api.on.windowMaximizeChanged((maximized: boolean) => {
        setIsMaximized(maximized)
      })
    }

    return () => {
      cleanup?.()
    }
  }, [])

  const handleMinimize = async () => {
    try {
      if (window.todo?.window?.minimize) {
        await window.todo.window.minimize()
      } else if (window.api?.window?.minimize) {
        await window.api.window.minimize()
      } else if (window.api?.app?.minimize) {
        await window.api.app.minimize()
      }
    } catch (err) {
      console.error('Failed to minimize window', err)
    }
  }

  const handleToggleMaximize = async () => {
    try {
      if (window.todo?.window?.toggleMaximize) {
        await window.todo.window.toggleMaximize()
      } else if (window.api?.window?.toggleMaximize) {
        await window.api.window.toggleMaximize()
      } else if (window.api?.app?.maximize) {
        await window.api.app.maximize()
      }
    } catch (err) {
      console.error('Failed to toggle maximize', err)
    }
  }

  const handleClose = async () => {
    try {
      if (window.todo?.window?.close) {
        await window.todo.window.close()
      } else if (window.api?.window?.close) {
        await window.api.window.close()
      } else if (window.api?.app?.close) {
        await window.api.app.close()
      }
    } catch (err) {
      console.error('Failed to close window', err)
    }
  }

  const handleDoubleClickTitleBar = (e: React.MouseEvent) => {
    // Only toggle if the target clicked is the titlebar container itself (drag region)
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-region')) {
      handleToggleMaximize()
    }
  }

  const currentViewLabel = t(`navigation:${currentView}`, { defaultValue: currentView })

  return (
    <div
      onDoubleClick={handleDoubleClickTitleBar}
      className="drag-region flex h-9 w-full select-none items-center justify-between border-b bg-sidebar text-sidebar-foreground text-xs shrink-0 transition-colors z-50"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App Logo, Name, and Sidebar Toggle */}
      <div className="flex items-center gap-2 pl-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <img
          src={appIcon}
          alt="Todo Logo"
          className="h-4 w-4 shrink-0 rounded pointer-events-none"
        />
        <span className="font-semibold text-xs tracking-tight text-foreground">
          Todo
        </span>

        <div className="h-3 w-[1px] bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          aria-label={t('navigation:toggleSidebar')}
          title={t('navigation:toggleSidebar')}
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="text-[11px] font-medium text-muted-foreground capitalize truncate max-w-[120px]">
          {currentViewLabel}
        </span>
      </div>

      {/* Center: Search trigger (Google style pill in titlebar) */}
      <div className="flex-1 max-w-sm px-2 flex justify-center">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex h-6 w-full max-w-[280px] items-center justify-between rounded-md border border-border/70 bg-muted/40 px-2.5 text-[11px] text-muted-foreground hover:bg-muted/70 hover:border-border hover:text-foreground transition-all shadow-none"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Search className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate">{t('navigation:searchPlaceholder')}</span>
          </div>
          <kbd className="pointer-events-none rounded border border-border/60 bg-muted/60 px-1 font-mono text-[9px] text-muted-foreground">
            Ctrl+F
          </kbd>
        </button>
      </div>

      {/* Right: Quick actions + Custom Windows Window Controls */}
      <div className="flex items-center h-full">
        {/* Quick action buttons */}
        <div className="flex items-center gap-0.5 pr-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuickAddOpen(true)}
            className="h-6 w-6 text-primary hover:bg-muted/60"
            title={`${t('navigation:quickAdd')} (Ctrl+N)`}
            aria-label={t('navigation:quickAdd')}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title={t('settings:appearance.theme')}
            aria-label={t('settings:appearance.theme')}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('settings')}
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title={`${t('navigation:settings')} (Ctrl+,)`}
            aria-label={t('navigation:settings')}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Windows 11 style Window Controls (Minimize, Maximize / Restore, Close) */}
        <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            type="button"
            onClick={handleMinimize}
            className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            title={t('common:windowControls.minimize')}
            aria-label={t('common:windowControls.minimize')}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleToggleMaximize}
            className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            title={isMaximized ? t('common:windowControls.restore') : t('common:windowControls.maximize')}
            aria-label={isMaximized ? t('common:windowControls.restore') : t('common:windowControls.maximize')}
          >
            {isMaximized ? (
              <Copy className="h-3 w-3 -scale-y-100 rotate-90" />
            ) : (
              <Square className="h-3 w-3" />
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-full w-11 items-center justify-center text-muted-foreground hover:bg-[#d93025] hover:text-white transition-colors"
            title={t('common:windowControls.close')}
            aria-label={t('common:windowControls.close')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
