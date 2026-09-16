import { memo } from 'react'
import type { Task } from '@shared/types'
import { PRIORITY_CONFIG } from '@shared/constants'
import { GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelativeDueDate } from '@/lib/date-format'

interface TaskDragPreviewProps {
  task: Task
}

export const TaskDragPreview = memo(function TaskDragPreview({ task }: TaskDragPreviewProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none

  return (
    <div className="w-[340px] max-w-[90vw] px-3.5 py-2.5 rounded-lg border border-primary/40 bg-card/95 backdrop-blur-md shadow-xl text-xs select-none pointer-events-none cursor-grabbing flex items-center gap-2.5 transition-all">
      <div className="text-primary shrink-0">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="h-3.5 w-3.5 rounded border border-border/80 shrink-0 bg-background/60" />

      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: priorityConfig.color }}
      />

      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-foreground tracking-tight">
          {task.title}
        </div>
        {task.description && (
          <div className="truncate text-[11px] text-muted-foreground mt-0.5">
            {task.description}
          </div>
        )}
      </div>

      {task.dueDate && (
        <Badge
          variant="outline"
          className="text-[10px] font-normal px-1.5 py-0 h-4.5 border-border/60 text-muted-foreground shrink-0 bg-muted/40"
        >
          {formatRelativeDueDate(task.dueDate)}
        </Badge>
      )}
    </div>
  )
})
