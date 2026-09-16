import { useEffect } from 'react'
import { useUiStore } from '../stores/ui-store'
import { useTaskStore } from '../stores/task-store'

export function useKeyboardShortcuts() {
  const {
    setQuickAddOpen,
    setSearchOpen,
    setCommandPaletteOpen,
    setView,
    selectedTaskId,
    openDetails,
    closeDetails
  } = useUiStore()

  const { completeTask, deleteTask } = useTaskStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      // Handle Ctrl combinations
      if (e.ctrlKey) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault()
          setQuickAddOpen(true)
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault()
          setSearchOpen(true)
        } else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault()
          setCommandPaletteOpen(true)
        } else if (e.key === '1') {
          e.preventDefault()
          setView('today')
        } else if (e.key === '2') {
          e.preventDefault()
          setView('upcoming')
        } else if (e.key === '3') {
          e.preventDefault()
          setView('inbox')
        } else if (e.key === ',') {
          e.preventDefault()
          setView('settings')
        }
        return
      }

      // Handle Escape
      if (e.key === 'Escape') {
        setQuickAddOpen(false)
        setSearchOpen(false)
        setCommandPaletteOpen(false)
        closeDetails()
        return
      }

      if (!isInput && selectedTaskId) {
        if (e.key === ' ') {
          e.preventDefault()
          completeTask(selectedTaskId)
        } else if (e.key === 'Delete') {
          e.preventDefault()
          if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(selectedTaskId)
          }
        } else if (e.key === 'Enter') {
          e.preventDefault()
          openDetails(selectedTaskId)
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault()
          openDetails(selectedTaskId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    setQuickAddOpen,
    setSearchOpen,
    setCommandPaletteOpen,
    setView,
    selectedTaskId,
    openDetails,
    closeDetails,
    completeTask,
    deleteTask
  ])
}
