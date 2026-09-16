import { useEffect, useState } from 'react'
import { InboxIcon, CalendarCheck, Calendar, CheckCircle2, Plus, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useUiStore, ViewType } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { useTagStore } from '@/stores/tag-store'
import { cn } from '@/lib/utils'
import type { TaskStats } from '@shared/types'
import { ProjectDialog } from '../project/project-dialog'

export function Sidebar() {
  const { t } = useTranslation(['navigation', 'projects', 'common'])
  const currentView = useUiStore(s => s.currentView)
  const currentProjectId = useUiStore(s => s.currentProjectId)
  const currentTagId = useUiStore(s => s.currentTagId)
  const setView = useUiStore(s => s.setView)
  const projects = useProjectStore(s => s.projects)
  const tags = useTagStore(s => s.tags)
  
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  useEffect(() => {
    if (window.api?.tasks?.getStats) {
      window.api.tasks.getStats().then(setStats).catch(console.error)
    }
  }, [currentView])

  const navItems: { id: ViewType; label: string; icon: typeof InboxIcon; count?: number }[] = [
    { id: 'inbox', label: t('navigation:inbox'), icon: InboxIcon, count: stats?.active },
    { id: 'today', label: t('navigation:today'), icon: CalendarCheck, count: stats?.dueToday },
    { id: 'upcoming', label: t('navigation:upcoming'), icon: Calendar, count: stats?.dueThisWeek },
    { id: 'completed', label: t('navigation:completed'), icon: CheckCircle2, count: stats?.completed },
  ]

  return (
    <ScrollArea className="h-full py-2 select-none">
      <div className="px-2 py-1">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-8 px-2 text-xs font-normal relative transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground font-medium shadow-none before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
                onClick={() => setView(item.id)}
              >
                <item.icon className="mr-2 h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono px-1 rounded bg-muted/40">
                    {item.count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="px-2 py-1 mt-3">
        <div className="flex items-center justify-between px-2 mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>{t('navigation:projects')}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
            title={t('navigation:addProject')}
            aria-label={t('navigation:addProject')}
            onClick={() => setProjectDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-0.5">
          {projects.map(project => {
            const isActive = currentView === 'project' && currentProjectId === project.id
            return (
              <Button
                key={project.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start h-8 px-2 text-xs font-normal relative transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground font-medium shadow-none before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-r before:bg-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
                onClick={() => setView('project', project.id)}
              >
                <div 
                  className="mr-2 h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: project.color || '#3b82f6' }} 
                />
                <span className="truncate">{project.name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="px-2 py-1 mt-3">
          <div className="px-2 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Hash className="h-3 w-3" /> {t('navigation:tags')}
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-md border transition-colors",
                  currentView === 'tag' && currentTagId === tag.id
                    ? "bg-primary text-primary-foreground border-transparent font-medium"
                    : "bg-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border-border/60"
                )}
                style={{
                  borderColor: currentView === 'tag' && currentTagId === tag.id ? undefined : `${tag.color || '#3b82f6'}40`
                }}
                onClick={() => setView('tag', tag.id)}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
      />
    </ScrollArea>
  )
}
