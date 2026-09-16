import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import type { Task } from '@shared/types'

export function SearchBar() {
  const { t } = useTranslation(['navigation', 'errors'])
  const { searchOpen, setSearchOpen, openDetails } = useUiStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])

  useEffect(() => {
    if (searchOpen) setQuery('')
  }, [searchOpen])

  useEffect(() => {
    const search = async () => {
      if (query.trim().length > 2 && window.api?.tasks?.search) {
        const res = await window.api.tasks.search(query)
        setResults(res)
      } else {
        setResults([])
      }
    }
    
    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query])

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden [&>button]:hidden rounded-xl border border-border shadow-2xl bg-popover text-popover-foreground">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
          <Input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('navigation:searchTasks')} 
            className="border-none focus-visible:ring-0 shadow-none px-0 h-12 text-sm bg-transparent placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {query.trim().length <= 2 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              {t('errors:searchMinChars')}
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              {t('errors:noResults')}
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {results.map(task => (
                <div 
                  key={task.id}
                  onClick={() => {
                    openDetails(task.id)
                    setSearchOpen(false)
                  }}
                  className="px-3 py-2 hover:bg-muted/60 rounded-md cursor-pointer flex flex-col gap-0.5 transition-colors text-xs"
                >
                  <div className={`font-medium ${task.completedAt ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {task.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
