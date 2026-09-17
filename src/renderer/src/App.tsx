import { useEffect, useState } from 'react'
import '@/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/app-layout'
import { CommandPalette } from '@/components/command/command-palette'
import { QuickAddDialog } from '@/components/quick-add/quick-add-dialog'
import { SearchBar } from '@/components/common/search-bar'
import { useProjectStore } from '@/stores/project-store'
import { useTagStore } from '@/stores/tag-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useUiStore } from '@/stores/ui-store'
import { useTaskStore } from '@/stores/task-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

import { SplashScreen } from '@/components/splash/splash-screen'

function MainApp() {
  const fetchProjects = useProjectStore(s => s.fetchProjects)
  const fetchTags = useTagStore(s => s.fetchTags)
  const fetchSettings = useSettingsStore(s => s.fetchSettings)
  const fetchStats = useTaskStore(s => s.fetchStats)

  // Register global in-app keyboard shortcuts
  useKeyboardShortcuts()

  useEffect(() => {
    // Setup initial data fetch
    fetchProjects().catch(console.error)
    fetchTags().catch(console.error)
    fetchSettings().catch(console.error)
    fetchStats().catch(console.error)

    // Listen for IPC events from Main process
    const cleanups: (() => void)[] = []
    if (window.api?.on?.navigateToTask) {
      cleanups.push(window.api.on.navigateToTask((taskId: string) => {
        useUiStore.getState().openDetails(taskId)
      }))
    }
    if (window.api?.on?.quickAdd) {
      cleanups.push(window.api.on.quickAdd(() => {
        useUiStore.getState().setQuickAddOpen(true)
      }))
    }
    if (window.api?.on?.taskUpdated) {
      cleanups.push(window.api.on.taskUpdated(() => {
        useTaskStore.getState().notifyTaskChanged()
      }))
    }

    return () => {
      cleanups.forEach(fn => fn())
    }
  }, [fetchProjects, fetchTags, fetchSettings, fetchStats])

  return (
    <ThemeProvider defaultTheme="system" storageKey="todo-theme">
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
        <AppLayout />
        <CommandPalette />
        <QuickAddDialog />
        <SearchBar />
        <Toaster richColors position="bottom-right" />
      </div>
    </ThemeProvider>
  )
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  if (hash.includes('splash')) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="todo-theme">
        <SplashScreen />
      </ThemeProvider>
    )
  }

  if (hash.includes('quick-add')) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="todo-theme">
        <div className="h-screen w-screen overflow-hidden bg-background/90 backdrop-blur-md flex items-center justify-center p-2">
          <QuickAddDialog standalone />
          <Toaster richColors position="bottom-center" />
        </div>
      </ThemeProvider>
    )
  }

  return <MainApp />
}
