import { useEffect, useState } from 'react'
import { InboxIcon, CalendarCheck, Calendar, CheckCircle2, Plus, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useUiStore, ViewType } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { useTagStore } from '@/stores/tag-store'
import { useTaskStore } from '@/stores/task-store'
import { cn } from '@/lib/utils'
import { ProjectDialog } from '../project/project-dialog'
import { DroppableContainer } from '@/components/drag-drop/DroppableContainer'
import { useTaskDnd } from '@/components/drag-drop/TaskDndContext'

export function Sidebar() {
  const { t } = useTranslation(['navigation', 'projects', 'common'])
  const currentView = useUiStore(s => s.currentView)
  const currentProjectId = useUiStore(s => s.currentProjectId)
  const currentTagId = useUiStore(s => s.currentTagId)
  const setView = useUiStore(s => s.setView)
  const projects = useProjectStore(s => s.projects)
  const tags = useTagStore(s => s.tags)
  const { isDragging } = useTaskDnd()
  
  const stats = useTaskStore(s => s.stats)
  const fetchStats = useTaskStore(s => s.fetchStats)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [fetchStats, currentView])

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
              <DroppableContainer
                key={item.id}
                id={`view:${item.id}`}
                className="rounded-md transition-all"
                activeClassName="bg-primary/20 ring-1 ring-primary/60 scale-[1.02]"
              >
                {(isOver) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-2.5 text-xs font-normal relative transition-colors rounded-md",
                      isActive
                        ? "bg-primary/12 text-foreground font-medium shadow-none before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-r before:bg-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      isOver && "bg-primary/20 text-primary font-medium"
                    )}
                    onClick={() => setView(item.id)}
                  >
                    <item.icon className={cn("mr-2.5 h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate">{item.label}</span>
                    {isDragging && isOver ? (
                      <span className="ml-auto text-[10px] font-medium text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                        Drop here
                      </span>
                    ) : typeof item.count === 'number' && item.count > 0 ? (
                      <span className={cn(
                        "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded",
                        isActive ? "text-primary bg-primary/15" : "text-muted-foreground bg-muted/60"
                      )}>
                        {item.count}
                      </span>
                    ) : null}
                  </Button>
                )}
              </DroppableContainer>
            )
          })}
        </div>
      </div>

      <div className="px-2 py-1 mt-3">
        <div className="flex items-center justify-between px-2 mb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>{t('navigation:projects')}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
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
              <DroppableContainer
                key={project.id}
                id={`project:${project.id}`}
                className="rounded-md transition-all"
                activeClassName="bg-primary/20 ring-1 ring-primary/60 scale-[1.02]"
              >
                {(isOver) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 px-2.5 text-xs font-normal relative transition-colors rounded-md",
                      isActive
                        ? "bg-primary/12 text-foreground font-medium shadow-none before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-r before:bg-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      isOver && "bg-primary/20 text-primary font-medium"
                    )}
                    onClick={() => setView('project', project.id)}
                  >
                    <div 
                      className="mr-2.5 h-2 w-2 rounded-full shrink-0" 
                      style={{ backgroundColor: project.color || '#8ab4f8' }} 
                    />
                    <span className="truncate">{project.name}</span>
                    {isDragging && isOver && (
                      <span className="ml-auto text-[10px] font-medium text-primary bg-primary/20 px-1.5 py-0.5 rounded">
                        Drop task here
                      </span>
                    )}
                  </Button>
                )}
              </DroppableContainer>
            )
          })}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="px-2 py-1 mt-3">
          <div className="px-2 mb-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
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
                    ? "bg-primary/15 text-primary border-primary/30 font-medium"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border-border/40"
                )}
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
