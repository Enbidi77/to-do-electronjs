import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import appIcon from '@/assets/icon.png'
import { Button } from '@/components/ui/button'
import type { StartupState } from '@shared/types'

const DEFAULT_STATE: StartupState = {
  phase: 'initializing',
  message: 'Preparing your workspace...',
  error: null,
  version: 'v1.0.0',
  appName: 'Todo',
  theme: 'system',
  systemIsDark: false,
  language: 'en'
}

export function SplashScreen() {
  const [status, setStatus] = useState<StartupState>(DEFAULT_STATE)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    // 1. Fetch initial state
    const fetchState = async () => {
      try {
        if (window.api?.startup?.getState) {
          const state = await window.api.startup.getState()
          if (state) setStatus(state)
        } else if (window.todo?.startup?.getState) {
          const state = await window.todo.startup.getState()
          if (state) setStatus(state)
        }
      } catch (err) {
        console.error('Failed to get startup state', err)
      }
    }

    fetchState()

    // 2. Subscribe to status change events
    if (window.api?.startup?.onStatusChange) {
      cleanup = window.api.startup.onStatusChange((newState) => {
        setStatus(newState)
        if (newState.phase !== 'error') {
          setIsRetrying(false)
        }
      })
    } else if (window.todo?.startup?.onStatusChange) {
      cleanup = window.todo.startup.onStatusChange((newState) => {
        setStatus(newState)
        if (newState.phase !== 'error') {
          setIsRetrying(false)
        }
      })
    } else if (window.api?.on?.startupStatusChanged) {
      cleanup = window.api.on.startupStatusChanged((newState) => {
        setStatus(newState)
        if (newState.phase !== 'error') {
          setIsRetrying(false)
        }
      })
    }

    return () => {
      cleanup?.()
    }
  }, [])

  const isVi = status.language === 'vi'
  const isError = status.phase === 'error'

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      if (window.api?.startup?.retry) {
        await window.api.startup.retry()
      } else if (window.todo?.startup?.retry) {
        await window.todo.startup.retry()
      }
    } catch (err) {
      console.error('Retry failed', err)
      setIsRetrying(false)
    }
  }

  const handleQuit = async () => {
    try {
      if (window.api?.startup?.quit) {
        await window.api.startup.quit()
      } else if (window.todo?.startup?.quit) {
        await window.todo.startup.quit()
      } else if (window.api?.app?.quit) {
        await window.api.app.quit()
      }
    } catch (err) {
      console.error('Quit failed', err)
    }
  }

  const subtitle = isVi ? 'Không gian làm việc của bạn' : 'Your personal workspace'
  const defaultLoadingMsg = isVi ? 'Đang chuẩn bị không gian làm việc...' : 'Preparing your workspace...'

  return (
    <div
      className="relative flex h-screen w-screen select-none flex-col justify-between overflow-hidden bg-background p-6 text-foreground antialiased border border-border/60"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Top / Center Branding */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card p-2 shadow-sm border border-border/70 transition-transform duration-200">
          <img
            src={appIcon}
            alt={status.appName}
            className="h-8 w-8 object-contain"
            draggable={false}
          />
        </div>
        <h1 className="mt-2.5 text-base font-semibold tracking-tight text-foreground">
          {status.appName}
        </h1>
        <p className="text-[12px] text-muted-foreground">{subtitle}</p>
      </div>

      {/* Middle Status or Error Area */}
      <div className="flex flex-col items-center justify-center px-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {!isError ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>{status.message || defaultLoadingMsg}</span>
            </div>

            {/* Subtle indeterminate progress bar */}
            <div className="h-0.5 w-36 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/3 rounded-full bg-primary/70 animate-indeterminate" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2.5 text-center">
            <div className="flex items-center space-x-1.5 text-destructive text-[12px] font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{isVi ? 'Không thể khởi động ứng dụng' : 'Unable to start the application'}</span>
            </div>
            <p className="max-w-[320px] text-[11px] text-muted-foreground leading-tight line-clamp-2">
              {status.error ||
                (isVi
                  ? 'Đã xảy ra sự cố khi tải ứng dụng. Vui lòng thử lại.'
                  : 'An error occurred while loading the application. Please retry.')}
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <Button
                variant="default"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="h-7 px-3 text-[11px] gap-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Thử lại' : 'Retry'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuit}
                className="h-7 px-3 text-[11px] gap-1.5"
              >
                <LogOut className="h-3 w-3" />
                <span>{isVi ? 'Thoát' : 'Quit'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Version Display */}
      <div className="flex items-center justify-center pb-1">
        <span className="text-[10px] tracking-wide text-muted-foreground/60 font-mono">
          {status.version}
        </span>
      </div>
    </div>
  )
}
