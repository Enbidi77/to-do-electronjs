import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Task } from '@shared/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type SubtaskListProps = {
  parentTaskId: string
}

interface SortableSubtaskItemProps {
  task: Task
  isCompleted: boolean
  onToggleComplete: () => void
  onDelete: () => void
}

function SortableSubtaskItem({
  task,
  isCompleted,
  onToggleComplete,
  onDelete
}: SortableSubtaskItemProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'subtask',
      task
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 group hover:bg-muted/40 px-1.5 py-1 rounded transition-colors text-xs ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 flex items-center justify-center p-0.5 rounded cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
        aria-label="Drag handle"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggleComplete}
        className="h-3.5 w-3.5 rounded-[3px]"
      />

      <span
        className={`flex-1 text-xs truncate ${
          isCompleted ? 'line-through text-muted-foreground/80' : 'text-foreground'
        }`}
      >
        {task.title}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-opacity"
        title={t('common:actions.delete')}
        aria-label={t('common:actions.delete')}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function SubtaskList({ parentTaskId }: SubtaskListProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')

  const fetchSubtasks = useCallback(async () => {
    if (window.api?.tasks?.getSubtasks) {
      const data = await window.api.tasks.getSubtasks(parentTaskId)
      setSubtasks(data)
    }
  }, [parentTaskId])

  useEffect(() => {
    fetchSubtasks()
  }, [fetchSubtasks])

  const subtaskIds = useMemo(() => subtasks.map(t => t.id), [subtasks])
  const completedCount = subtasks.filter(t => t.completedAt || t.status === 'completed').length
  const total = subtasks.length
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100)

  const handleAdd = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTitle.trim()) {
      e.preventDefault()
      if (window.api?.tasks?.create) {
        const maxOrder = subtasks.length > 0 ? Math.max(...subtasks.map(t => t.sortOrder ?? 0)) : 0
        await window.api.tasks.create({
          title: newTitle.trim(),
          parentTaskId,
          sortOrder: maxOrder + 1000
        })
        setNewTitle('')
        fetchSubtasks()
      }
    }
  }

  const toggleComplete = async (id: string, current: boolean) => {
    setSubtasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: current ? 'active' : 'completed',
              completedAt: current ? null : new Date().toISOString()
            }
          : t
      )
    )

    if (window.api?.tasks) {
      try {
        if (current) {
          await window.api.tasks.uncomplete(id)
        } else {
          await window.api.tasks.complete(id)
        }
      } catch (err) {
        console.error('Failed to toggle subtask completion', err)
      } finally {
        await fetchSubtasks()
      }
    }
  }

  const handleDelete = async (id: string) => {
    setSubtasks(prev => prev.filter(t => t.id !== id))
    if (window.api?.tasks?.delete) {
      try {
        await window.api.tasks.delete(id)
      } finally {
        fetchSubtasks()
      }
    }
  }

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>{t('tasks:subtasks')}</span>
        <span>{t('tasks:subtasksProgress', { completed: completedCount, total })}</span>
      </div>

      {total > 0 && (
        <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <SortableContext items={subtaskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5 mt-2">
          {subtasks.map(task => {
            const isCompleted = !!task.completedAt || task.status === 'completed'
            return (
              <SortableSubtaskItem
                key={task.id}
                task={task}
                isCompleted={isCompleted}
                onToggleComplete={() => toggleComplete(task.id, isCompleted)}
                onDelete={() => handleDelete(task.id)}
              />
            )
          })}
        </div>
      </SortableContext>

      <div className="flex items-center gap-2 pt-1">
        <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleAdd}
          placeholder={t('tasks:addSubtask')}
          className="h-7 border-none focus-visible:ring-0 shadow-none px-0 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
