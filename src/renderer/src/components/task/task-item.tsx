import { memo } from 'react'
import { isToday, isPast } from 'date-fns'
import { Edit, Trash2, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Task } from '@shared/types'
import { PRIORITY_CONFIG } from '@shared/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatRelativeDueDate } from '@/lib/date-format'

type TaskItemProps = {
  task: Task
  onComplete: (id: string, completed: boolean) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  isSelected: boolean
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

export const TaskItem = memo(function TaskItem({
  task,
  onComplete,
  onSelect,
  onDelete,
  isSelected,
  isDragging = false,
  dragHandleProps
}: TaskItemProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate))
  const isCompleted = !!task.completedAt || task.status === 'completed'

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete(task.id, !isCompleted)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(task.id)
  }

  const priorityLabel = t(`tasks:priorities.${task.priority}`, { defaultValue: priorityConfig.label })

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={cn(
        "group flex items-center gap-2.5 px-3.5 py-2 border-b border-border/50 cursor-pointer transition-colors select-none text-xs",
        "hover:bg-muted/30",
        isSelected && "bg-primary/10 text-foreground border-l-2 border-l-primary pl-[12px]",
        isCompleted && "opacity-65"
      )}
    >
      <div onClick={handleCheckboxClick} className="shrink-0 flex items-center justify-center">
        <Checkbox
          checked={isCompleted}
          aria-label={isCompleted ? t('tasks:reopen') : t('tasks:complete')}
          className="h-4 w-4"
        />
      </div>

      <div
        {...dragHandleProps}
        className={cn(
          "shrink-0 flex items-center justify-center p-0.5 rounded cursor-grab text-muted-foreground/60 transition-opacity",
          "hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isDragging ? "cursor-grabbing opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
        title={t('common:actions.drag', { defaultValue: 'Drag to reorder' })}
        aria-label="Drag handle"
        role="button"
        tabIndex={0}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div 
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125" 
        style={{ backgroundColor: priorityConfig.color }}
        title={`${t('tasks:priority')}: ${priorityLabel}`}
      />

      <div className="flex-1 min-w-0 pr-2">
        <div className={cn(
          "truncate text-xs tracking-tight transition-colors",
          isCompleted ? "line-through text-muted-foreground font-normal" : "text-foreground font-medium"
        )}>
          {task.title}
        </div>
        {task.description && !isCompleted && (
          <div className="truncate text-[11px] text-muted-foreground mt-0.5 font-normal">
            {task.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {task.dueDate && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[11px] font-normal px-1.5 py-0 h-5 border-border/60",
              isOverdue ? "text-destructive border-destructive/30 bg-destructive/10 font-medium" :
              isDueToday ? "text-warning border-warning/30 bg-warning/10 font-medium" : 
              "text-muted-foreground bg-muted/20"
            )}
          >
            {formatRelativeDueDate(task.dueDate)}
          </Badge>
        )}

        {!isDragging && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              title={t('common:actions.edit')}
              aria-label={t('common:actions.edit')}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(task.id)
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/15"
              title={t('common:actions.delete')}
              aria-label={t('common:actions.delete')}
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})
