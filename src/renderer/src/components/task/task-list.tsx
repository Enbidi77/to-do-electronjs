import { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { Task } from '@shared/types'
import { SortableTaskItem } from '@/components/drag-drop/SortableTaskItem'
import { useTaskDnd } from '@/components/drag-drop/TaskDndContext'
import { useUiStore } from '@/stores/ui-store'
import { Skeleton } from '@/components/ui/skeleton'
import { ListFilter, ArrowDownUp, InboxIcon, LayoutList, Kanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '../common/empty-state'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskContextMenu } from './task-context-menu'

type TaskListProps = {
  tasks: Task[]
  isLoading?: boolean
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  title?: string
  showViewToggle?: boolean
}

export function TaskList({
  tasks,
  isLoading,
  onComplete,
  onDelete,
  title,
  showViewToggle = true
}: TaskListProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const parentRef = useRef<HTMLDivElement>(null)
  const selectedTaskId = useUiStore(s => s.selectedTaskId)
  const openDetails = useUiStore(s => s.openDetails)
  const taskViewMode = useUiStore(s => s.taskViewMode)
  const setTaskViewMode = useUiStore(s => s.setTaskViewMode)
  const { activeTaskId } = useTaskDnd()

  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks])
  const useVirtual = tasks.length > 100

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 37,
  })

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 p-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-9 w-full rounded" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <EmptyState
          icon={InboxIcon}
          title={t('tasks:emptyTitle')}
          description={t('tasks:emptyDescription')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border/60 shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-xs tracking-tight text-foreground">{title}</h2>
            <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted/50">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {showViewToggle && (
              <div className="flex items-center border border-border/60 rounded-md p-0.5 mr-1 bg-muted/20">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 rounded-sm ${taskViewMode === 'list' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
                  title="List view"
                  onClick={() => setTaskViewMode('list')}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 rounded-sm ${taskViewMode === 'board' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
                  title="Board view"
                  onClick={() => setTaskViewMode('board')}
                >
                  <Kanban className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={t('common:actions.sort')}
              aria-label={t('common:actions.sort')}
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title={t('common:actions.filter')}
              aria-label={t('common:actions.filter')}
            >
              <ListFilter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={parentRef} className="flex-1 overflow-auto">
          {useVirtual ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const task = tasks[virtualItem.index]
                if (!task) return null
                return (
                  <div
                    key={task.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <TaskContextMenu task={task}>
                      <SortableTaskItem
                        task={task}
                        index={virtualItem.index}
                        onComplete={onComplete}
                        onDelete={onDelete}
                        onSelect={openDetails}
                        isSelected={selectedTaskId === task.id}
                        activeTaskId={activeTaskId}
                      />
                    </TaskContextMenu>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tasks.map((task, index) => (
                <TaskContextMenu key={task.id} task={task}>
                  <SortableTaskItem
                    task={task}
                    index={index}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onSelect={openDetails}
                    isSelected={selectedTaskId === task.id}
                    activeTaskId={activeTaskId}
                  />
                </TaskContextMenu>
              ))}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
