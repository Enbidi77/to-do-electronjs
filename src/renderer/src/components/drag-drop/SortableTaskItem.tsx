import { memo, useRef, useState, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@shared/types'
import { TaskItem } from '@/components/task/task-item'
import { DropIndicator, DropIndicatorPosition } from './DropIndicator'
import { isCircularSubtask } from '@/lib/ordering'
import { useTaskStore } from '@/stores/task-store'

interface SortableTaskItemProps {
  task: Task
  index: number
  onComplete: (id: string, completed: boolean) => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  isSelected: boolean
  activeTaskId?: string | null
  disabled?: boolean
}

export const SortableTaskItem = memo(function SortableTaskItem({
  task,
  index,
  onComplete,
  onSelect,
  onDelete,
  isSelected,
  activeTaskId,
  disabled = false
}: SortableTaskItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [dropPosition, setDropPosition] = useState<DropIndicatorPosition>('none')
  const allTasks = useTaskStore(s => s.tasks)

  const isInvalidDrop = useMemo(() => {
    if (!activeTaskId || activeTaskId === task.id) return false
    return isCircularSubtask(activeTaskId, task.id, allTasks)
  }, [activeTaskId, task.id, allTasks])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      index
    },
    disabled
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeTaskId || activeTaskId === task.id || !itemRef.current) {
      if (dropPosition !== 'none') setDropPosition('none')
      return
    }

    const rect = itemRef.current.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const height = rect.height

    // Top 25%: reorder above
    // Middle 50%: make subtask (unless invalid)
    // Bottom 25%: reorder below
    if (relativeY < height * 0.25) {
      setDropPosition('top')
    } else if (relativeY > height * 0.75) {
      setDropPosition('bottom')
    } else {
      setDropPosition('subtask')
    }
  }

  const handlePointerLeave = () => {
    setDropPosition('none')
  }

  const indicatorPos: DropIndicatorPosition =
    isOver && activeTaskId && activeTaskId !== task.id ? dropPosition : 'none'

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        // @ts-ignore
        itemRef.current = node
      }}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative group ${isDragging ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <DropIndicator
        position={indicatorPos}
        isInvalid={isInvalidDrop}
        parentTitle={task.title}
      />

      <TaskItem
        task={task}
        onComplete={onComplete}
        onSelect={onSelect}
        onDelete={onDelete}
        isSelected={isSelected}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
})
