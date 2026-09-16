import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TitleBar } from '@/components/layout/title-bar'
import '@/i18n'

describe('TitleBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders application title', () => {
    render(<TitleBar />)
    expect(screen.getByText('Todo')).toBeDefined()
  })

  it('calls minimize when minimize button is clicked', () => {
    render(<TitleBar />)
    const minimizeBtn = screen.getByTitle(/minimize|thu nhỏ/i)
    fireEvent.click(minimizeBtn)
    expect(window.todo.window.minimize).toHaveBeenCalled()
  })

  it('calls toggleMaximize when maximize button is clicked', () => {
    render(<TitleBar />)
    const maximizeBtn = screen.getByTitle(/maximize|phóng to/i)
    fireEvent.click(maximizeBtn)
    expect(window.todo.window.toggleMaximize).toHaveBeenCalled()
  })

  it('calls close when close button is clicked', () => {
    render(<TitleBar />)
    const closeBtn = screen.getByTitle(/close|đóng/i)
    fireEvent.click(closeBtn)
    expect(window.todo.window.close).toHaveBeenCalled()
  })

  it('toggles maximize on double-clicking title bar', () => {
    const { container } = render(<TitleBar />)
    const titleBar = container.firstChild as HTMLElement
    fireEvent.doubleClick(titleBar)
    expect(window.todo.window.toggleMaximize).toHaveBeenCalled()
  })

  it('updates maximize state when IPC listener fires', async () => {
    let maximizeCallback: ((isMax: boolean) => void) | null = null
    window.todo.window.onMaximizeChanged = vi.fn().mockImplementation((cb) => {
      maximizeCallback = cb
      return () => {}
    })
    window.todo.window.isMaximized = vi.fn().mockResolvedValue(false)

    render(<TitleBar />)
    await waitFor(() => {
      expect(window.todo.window.onMaximizeChanged).toHaveBeenCalled()
    })

    if (maximizeCallback) {
      const cb = maximizeCallback as (isMax: boolean) => void
      act(() => {
        cb(true)
      })
      await waitFor(() => {
        expect(screen.getByTitle(/restore|khôi phục/i)).toBeDefined()
      })
    }
  })
})
