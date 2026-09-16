import { memo } from 'react'
import { isToday, isPast } from 'date-fns'
import { Edit, Trash2 } from 'lucide-react'
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
}

export const TaskItem = memo(function TaskItem({ task, onComplete, onSelect, onDelete, isSelected }: TaskItemProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate))

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComplete(task.id, !task.completedAt)
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
        "group flex items-center gap-2.5 px-3.5 py-2 border-b border-border/60 cursor-pointer transition-colors select-none text-xs",
        "hover:bg-muted/40",
        isSelected && "bg-accent/50 text-foreground border-l-2 border-l-primary pl-[12px]",
        task.completedAt && "bg-muted/10 opacity-75"
      )}
    >
      <div onClick={handleCheckboxClick} className="shrink-0 flex items-center justify-center">
        <Checkbox
          checked={!!task.completedAt}
          aria-label={task.completedAt ? t('tasks:reopen') : t('tasks:complete')}
          className="h-4 w-4 rounded-[4px]"
        />
      </div>

      <div 
        className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125" 
        style={{ backgroundColor: priorityConfig.color }}
        title={`${t('tasks:priority')}: ${priorityLabel}`}
      />

      <div className="flex-1 min-w-0 pr-2">
        <div className={cn(
          "truncate text-xs font-normal tracking-tight transition-colors",
          task.completedAt ? "line-through text-muted-foreground/80 font-normal" : "text-foreground font-medium"
        )}>
          {task.title}
        </div>
        {task.description && !task.completedAt && (
          <div className="truncate text-[11px] text-muted-foreground/80 mt-0.5 font-normal">
            {task.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {task.dueDate && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[11px] font-normal px-1.5 py-0 h-5 border-border/80",
              isOverdue ? "text-destructive border-destructive/40 bg-destructive/5 font-medium" :
              isDueToday ? "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 font-medium" : 
              "text-muted-foreground bg-background/50"
            )}
          >
            {formatRelativeDueDate(task.dueDate)}
          </Badge>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
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
            className="h-6 w-6 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            title={t('common:actions.delete')}
            aria-label={t('common:actions.delete')}
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
})
