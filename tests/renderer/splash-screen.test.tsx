import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SplashScreen } from '@/components/splash/splash-screen'
import type { StartupState } from '@shared/types'

describe('SplashScreen component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.api.startup.getState).mockResolvedValue({
      phase: 'initializing',
      message: 'Preparing your workspace...',
      error: null,
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'en'
    })
  })

  it('renders initial state with app name, subtitle, and version', async () => {
    render(<SplashScreen />)

    await waitFor(() => {
      expect(screen.getByText('Todo')).toBeDefined()
      expect(screen.getByText('Your personal workspace')).toBeDefined()
      expect(screen.getByText('v1.0.0')).toBeDefined()
      expect(screen.getByText(/Preparing your workspace/i)).toBeDefined()
    })
  })

  it('updates status and message when onStatusChange fires', async () => {
    let statusCallback: ((state: StartupState) => void) | undefined

    vi.mocked(window.api.startup.onStatusChange).mockImplementation((cb) => {
      statusCallback = cb
      return () => {}
    })

    render(<SplashScreen />)

    // Wait for initial getState to settle
    await waitFor(() => {
      expect(window.api.startup.getState).toHaveBeenCalled()
    })

    await act(async () => {
      statusCallback?.({
        phase: 'database',
        message: 'Connecting to workspace...',
        error: null,
        version: 'v1.2.0',
        appName: 'Todo',
        theme: 'system',
        systemIsDark: false,
        language: 'en'
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Connecting to workspace...')).toBeDefined()
      expect(screen.getByText('v1.2.0')).toBeDefined()
    })
  })

  it('displays Vietnamese text when language is vi', async () => {
    vi.mocked(window.api.startup.getState).mockResolvedValue({
      phase: 'database',
      message: 'Đang kết nối không gian làm việc...',
      error: null,
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'vi'
    })

    render(<SplashScreen />)

    await waitFor(() => {
      expect(screen.getByText('Không gian làm việc của bạn')).toBeDefined()
      expect(screen.getByText('Đang kết nối không gian làm việc...')).toBeDefined()
    })
  })

  it('displays error state with friendly message, Retry and Quit buttons', async () => {
    vi.mocked(window.api.startup.getState).mockResolvedValue({
      phase: 'error',
      message: 'Unable to start the application.',
      error: 'Could not connect to or initialize the workspace database.',
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'en'
    })

    render(<SplashScreen />)

    await waitFor(() => {
      expect(screen.getByText('Unable to start the application')).toBeDefined()
      expect(screen.getByText('Could not connect to or initialize the workspace database.')).toBeDefined()
      expect(screen.getByRole('button', { name: /retry/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /quit/i })).toBeDefined()
    })
  })

  it('calls retry API when Retry button is clicked', async () => {
    vi.mocked(window.api.startup.getState).mockResolvedValue({
      phase: 'error',
      message: 'Unable to start the application.',
      error: 'Failed to connect',
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'en'
    })

    render(<SplashScreen />)

    const retryBtn = await screen.findByRole('button', { name: /retry/i })
    await act(async () => {
      fireEvent.click(retryBtn)
    })

    expect(window.api.startup.retry).toHaveBeenCalledTimes(1)
  })

  it('calls quit API when Quit button is clicked', async () => {
    vi.mocked(window.api.startup.getState).mockResolvedValue({
      phase: 'error',
      message: 'Unable to start the application.',
      error: 'Failed to connect',
      version: 'v1.0.0',
      appName: 'Todo',
      theme: 'system',
      systemIsDark: false,
      language: 'en'
    })

    render(<SplashScreen />)

    const quitBtn = await screen.findByRole('button', { name: /quit/i })
    await act(async () => {
      fireEvent.click(quitBtn)
    })

    expect(window.api.startup.quit).toHaveBeenCalledTimes(1)
  })
})
