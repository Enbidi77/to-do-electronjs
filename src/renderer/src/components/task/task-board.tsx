import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import type { Task, Stage } from '@shared/types'
import { DroppableContainer } from '@/components/drag-drop/DroppableContainer'
import { SortableTaskItem } from '@/components/drag-drop/SortableTaskItem'
import { useTaskDnd } from '@/components/drag-drop/TaskDndContext'
import { useUiStore } from '@/stores/ui-store'
import { useStageStore } from '@/stores/stage-store'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { TaskContextMenu } from './task-context-menu'
import {
  Circle,
  LayoutList,
  Kanban as KanbanIcon,
  Plus,
  MoreHorizontal,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Trash2,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { StageDialog, STAGE_ICONS } from '@/components/stage/stage-dialog'
import { DeleteStageDialog } from '@/components/stage/delete-stage-dialog'

interface TaskBoardProps {
  tasks: Task[]
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  title?: string
}

const DEFAULT_FALLBACK_STAGES: Stage[] = [
  { id: 'active', name: 'To Do', color: '#94a3b8', icon: 'circle', sortOrder: 1000, isCompleted: false, createdAt: '', updatedAt: '' },
  { id: 'in_progress', name: 'In Progress', color: '#f59e0b', icon: 'clock', sortOrder: 2000, isCompleted: false, createdAt: '', updatedAt: '' },
  { id: 'completed', name: 'Done', color: '#10b981', icon: 'check-circle-2', sortOrder: 3000, isCompleted: true, createdAt: '', updatedAt: '' }
]

interface SortableStageColumnProps {
  stage: Stage
  index: number
  stagesCount: number
  tasks: Task[]
  activeTaskId: string | null
  selectedTaskId: string | null
  onComplete: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  onEditStage: (stage: Stage) => void
  onDeleteStage: (stage: Stage) => void
  onMoveStage: (index: number, direction: 'left' | 'right') => void
}

const SortableStageColumn = memo(function SortableStageColumn({
  stage,
  index,
  stagesCount,
  tasks,
  activeTaskId,
  selectedTaskId,
  onComplete,
  onDelete,
  onSelect,
  onEditStage,
  onDeleteStage,
  onMoveStage
}: SortableStageColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `stage:${stage.id}`,
    data: {
      type: 'stage',
      stage
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  }

  const IconComp = (stage.icon && STAGE_ICONS[stage.icon]) || Circle
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex-1 min-w-[260px] max-w-[360px] flex flex-col rounded-xl border border-border/60 bg-card/60 shadow-xs backdrop-blur-xs overflow-hidden transition-all",
        isDragging && "ring-2 ring-primary/40 shadow-lg"
      )}
    >
      {/* Column Header — draggable via listeners and attributes */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 bg-muted/30 shrink-0 cursor-grab active:cursor-grabbing select-none group hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 -ml-1" />
          <IconComp className="h-3.5 w-3.5 shrink-0" style={{ color: stage.color }} />
          <span className="font-semibold text-xs text-foreground truncate" title={stage.name}>
            {stage.name}
          </span>
          {stage.isCompleted && stage.name.toLowerCase() !== 'done' && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
              Done
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onPointerDown={e => e.stopPropagation()}>
          <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-full bg-background border border-border/50">
            {tasks.length}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-sm"
                title="Stage options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem onClick={() => onEditStage(stage)} className="gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Edit Stage</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMoveStage(index, 'left')}
                disabled={index === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Move Left</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMoveStage(index, 'right')}
                disabled={index === stagesCount - 1}
                className="gap-2"
              >
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Move Right</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteStage(stage)}
                disabled={stagesCount <= 1}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Stage</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Droppable Task Container */}
      <DroppableContainer
        id={`status:${stage.id}`}
        className="flex-1 p-2 overflow-y-auto space-y-2 min-h-[150px]"
        activeClassName="bg-primary/10 border-primary/60 ring-2 ring-primary/20"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task, taskIndex) => (
            <TaskContextMenu key={task.id} task={task}>
              <div className="rounded-lg border border-border/50 bg-background hover:border-border transition-all shadow-xs overflow-hidden">
                <SortableTaskItem
                  task={task}
                  index={taskIndex}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  isSelected={selectedTaskId === task.id}
                  activeTaskId={activeTaskId}
                />
              </div>
            </TaskContextMenu>
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-28 flex items-center justify-center border-2 border-dashed border-border/30 rounded-lg text-muted-foreground/60 text-xs">
            Drop tasks here
          </div>
        )}
      </DroppableContainer>
    </div>
  )
})

export function TaskBoard({ tasks, onComplete, onDelete, title }: TaskBoardProps) {
  const selectedTaskId = useUiStore(s => s.selectedTaskId)
  const openDetails = useUiStore(s => s.openDetails)
  const setTaskViewMode = useUiStore(s => s.setTaskViewMode)
  const taskViewMode = useUiStore(s => s.taskViewMode)
  const { activeTaskId } = useTaskDnd()

  const stagesFromStore = useStageStore(s => s.stages)
  const fetchStages = useStageStore(s => s.fetchStages)
  const reorderStages = useStageStore(s => s.reorderStages)

  // Dialog states
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null)

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  // Listen for stage changes from other windows/IPC if available
  useEffect(() => {
    if (window.api?.on?.stagesUpdated) {
      const unsub = window.api.on.stagesUpdated((updatedStages) => {
        useStageStore.getState().setStages(updatedStages)
      })
      return () => unsub()
    }
    return undefined
  }, [])

  const stages = useMemo(() => {
    return stagesFromStore.length > 0 ? stagesFromStore : DEFAULT_FALLBACK_STAGES
  }, [stagesFromStore])

  const columnTasks = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const s of stages) {
      map[s.id] = []
    }

    for (const t of tasks) {
      if (t.status === 'archived') continue

      if (map[t.status]) {
        map[t.status].push(t)
      } else if (t.completedAt) {
        // Fallback for completed task without exact stage match
        const completedStage = stages.find(s => s.isCompleted || s.id === 'completed')
        if (completedStage && map[completedStage.id]) {
          map[completedStage.id].push(t)
        } else if (stages[0]) {
          map[stages[0].id]?.push(t)
        }
      } else if (stages[0]) {
        map[stages[0].id]?.push(t)
      }
    }

    return map
  }, [tasks, stages])

  const stageSortableIds = useMemo(() => {
    return stages.map(s => `stage:${s.id}`)
  }, [stages])

  const handleOpenNewStage = useCallback(() => {
    setEditingStage(null)
    setStageDialogOpen(true)
  }, [])

  const handleEditStage = useCallback((stage: Stage) => {
    setEditingStage(stage)
    setStageDialogOpen(true)
  }, [])

  const handleDeleteStage = useCallback((stage: Stage) => {
    setDeletingStage(stage)
    setDeleteDialogOpen(true)
  }, [])

  const handleMoveStage = useCallback((index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= stages.length) return

    const newStages = [...stages]
    const temp = newStages[index]
    newStages[index] = newStages[targetIndex]
    newStages[targetIndex] = temp

    reorderStages(newStages.map(s => s.id))
  }, [stages, reorderStages])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 shrink-0 bg-background">
        <div className="flex items-center gap-2">
          {title && <h2 className="font-semibold text-xs tracking-tight text-foreground">{title}</h2>}
          <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted/50">
            {tasks.length} tasks
          </span>
          <span className="text-[11px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted/50">
            {stages.length} stages
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewStage}
            className="h-7 text-xs px-2.5 gap-1.5 border-dashed hover:border-primary hover:text-primary transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Stage</span>
          </Button>

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
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 bg-muted/10 select-none">
        <SortableContext items={stageSortableIds} strategy={horizontalListSortingStrategy}>
          {stages.map((stage, index) => (
            <SortableStageColumn
              key={stage.id}
              stage={stage}
              index={index}
              stagesCount={stages.length}
              tasks={columnTasks[stage.id] || []}
              activeTaskId={activeTaskId}
              selectedTaskId={selectedTaskId}
              onComplete={onComplete}
              onDelete={onDelete}
              onSelect={openDetails}
              onEditStage={handleEditStage}
              onDeleteStage={handleDeleteStage}
              onMoveStage={handleMoveStage}
            />
          ))}
        </SortableContext>

        {/* Add Stage Card */}
        <div className="min-w-[200px] max-w-[260px] shrink-0">
          <button
            type="button"
            onClick={handleOpenNewStage}
            className="w-full h-24 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary cursor-pointer group shadow-xs"
          >
            <div className="w-8 h-8 rounded-full border border-border/60 group-hover:border-primary/50 flex items-center justify-center transition-colors bg-background/50">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold tracking-tight">Add Stage</span>
          </button>
        </div>
      </div>

      {/* Stage Create/Edit Dialog */}
      <StageDialog
        open={stageDialogOpen}
        onOpenChange={setStageDialogOpen}
        stage={editingStage}
      />

      {/* Stage Delete Dialog */}
      <DeleteStageDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        stage={deletingStage}
      />
    </div>
  )
}
