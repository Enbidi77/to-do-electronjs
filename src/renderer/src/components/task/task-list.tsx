import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { Task } from '@shared/types'
import { TaskItem } from './task-item'
import { useUiStore } from '@/stores/ui-store'
import { Skeleton } from '@/components/ui/skeleton'
import { ListFilter, ArrowDownUp, InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '../common/empty-state'

type TaskListProps = {
  tasks: Task[]
  isLoading?: boolean
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  title?: string
}

export function TaskList({ tasks, isLoading, onComplete, onDelete, title }: TaskListProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const parentRef = useRef<HTMLDivElement>(null)
  const selectedTaskId = useUiStore(s => s.selectedTaskId)
  const openDetails = useUiStore(s => s.openDetails)

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 37,
  })

  if (isLoading) {
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
        <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border/80 shrink-0 bg-background">
          <h2 className="font-semibold text-sm tracking-tight text-foreground">{title}</h2>
          <div className="flex items-center gap-1">
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
      
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const task = tasks[virtualItem.index]
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
                <TaskItem
                  task={task}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onSelect={openDetails}
                  isSelected={selectedTaskId === task.id}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
