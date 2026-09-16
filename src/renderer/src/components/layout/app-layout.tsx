import { useEffect, useRef } from 'react'
import { TitleBar } from './title-bar'
import { Sidebar } from './sidebar'
import { ContentArea } from './content-area'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { TaskDetails } from '../task/task-details'

export function AppLayout() {
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const setSidebarCollapsed = useUiStore(s => s.setSidebarCollapsed)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width < 768) {
          if (!useUiStore.getState().sidebarCollapsed) {
            setSidebarCollapsed(true)
          }
        }
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [setSidebarCollapsed])

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar flex-shrink-0",
            sidebarCollapsed ? "w-0 overflow-hidden border-none" : "w-[240px]"
          )}
        >
          <Sidebar />
        </div>
        <main className="flex-1 overflow-hidden relative bg-background">
          <ContentArea />
        </main>
      </div>
      <TaskDetails />
    </div>
  )
}

