import { PanelLeft, Search, Plus, Sun, Moon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'
import { useTheme } from '@/components/theme-provider'

export function Header() {
  const toggleSidebar = useUiStore(s => s.toggleSidebar)
  const setSearchOpen = useUiStore(s => s.setSearchOpen)
  const setQuickAddOpen = useUiStore(s => s.setQuickAddOpen)
  const setView = useUiStore(s => s.setView)
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-12 items-center justify-between border-b px-4 shrink-0 bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Todo</span>
      </div>

      <div className="flex-1 max-w-md px-4">
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground h-8 px-3"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="text-xs">Search tasks...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">Ctrl</span>F
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Quick Add (Ctrl+N)" onClick={() => setQuickAddOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          title="Toggle Theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings (Ctrl+,)" onClick={() => setView('settings')}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
