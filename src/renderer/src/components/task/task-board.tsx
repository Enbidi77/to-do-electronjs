import { useMemo } from 'react'
import type { Task, TaskStatus } from '@shared/types'
import { DroppableContainer } from '@/components/drag-drop/DroppableContainer'
import { SortableTaskItem } from '@/components/drag-drop/SortableTaskItem'
import { useTaskDnd } from '@/components/drag-drop/TaskDndContext'
import { useUiStore } from '@/stores/ui-store'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskContextMenu } from './task-context-menu'
import { Circle, Clock, CheckCircle2, LayoutList, Kanban as KanbanIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskBoardProps {
  tasks: Task[]
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  title?: string
}

interface ColumnConfig {
  id: TaskStatus
  title: string
  icon: typeof Circle
  color: string
}

const COLUMNS: ColumnConfig[] = [
  { id: 'active', title: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'text-amber-500' },
  { id: 'completed', title: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
]

export function TaskBoard({ tasks, onComplete, onDelete, title }: TaskBoardProps) {
  const selectedTaskId = useUiStore(s => s.selectedTaskId)
  const openDetails = useUiStore(s => s.openDetails)
  const setTaskViewMode = useUiStore(s => s.setTaskViewMode)
  const taskViewMode = useUiStore(s => s.taskViewMode)
  const { activeTaskId } = useTaskDnd()

  const columnTasks = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      active: [],
      in_progress: [],
      completed: [],
      archived: []
    }

    for (const t of tasks) {
      if (t.status === 'archived') continue
      if (t.completedAt || t.status === 'completed') {
        map.completed.push(t)
      } else if (t.status === 'in_progress') {
        map.in_progress.push(t)
      } else {
        map.active.push(t)
      }
    }

    return map
  }, [tasks])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 shrink-0 bg-background">
        <div className="flex items-center gap-2">
          {title && <h2 className="font-semibold text-xs tracking-tight text-foreground">{title}</h2>}
          <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted/50">
            {tasks.length} tasks
          </span>
        </div>

        <div className="flex items-center border border-border/60 rounded-md p-0.5 bg-muted/20">
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
            <KanbanIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 bg-muted/10 select-none">
        {COLUMNS.map((col) => {
          const colTasks = columnTasks[col.id]
          const colTaskIds = colTasks.map(t => t.id)
          const Icon = col.icon

          return (
            <DroppableContainer
              key={col.id}
              id={`status:${col.id}`}
              className="flex-1 min-w-[260px] max-w-[360px] flex flex-col rounded-xl border border-border/60 bg-card/60 shadow-xs backdrop-blur-xs overflow-hidden"
              activeClassName="bg-primary/10 border-primary/60 ring-2 ring-primary/20"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${col.color}`} />
                  <span className="font-semibold text-xs text-foreground">{col.title}</span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-full bg-background border border-border/50">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks in Column */}
              <div className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[150px]">
                <SortableContext items={colTaskIds} strategy={verticalListSortingStrategy}>
                  {colTasks.map((task, index) => (
                    <TaskContextMenu key={task.id} task={task}>
                      <div className="rounded-lg border border-border/50 bg-background hover:border-border transition-all shadow-xs overflow-hidden">
                        <SortableTaskItem
                          task={task}
                          index={index}
                          onComplete={onComplete}
                          onDelete={onDelete}
                          onSelect={openDetails}
                          isSelected={selectedTaskId === task.id}
                          activeTaskId={activeTaskId}
                        />
                      </div>
                    </TaskContextMenu>
                  ))}
                </SortableContext>

                {colTasks.length === 0 && (
                  <div className="h-28 flex items-center justify-center border-2 border-dashed border-border/30 rounded-lg text-muted-foreground/60 text-xs">
                    Drop tasks here
                  </div>
                )}
              </div>
            </DroppableContainer>
          )
        })}
      </div>
    </div>
  )
}
