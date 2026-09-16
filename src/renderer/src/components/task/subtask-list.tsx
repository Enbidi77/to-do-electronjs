import React, { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Task } from '@shared/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type SubtaskListProps = {
  parentTaskId: string
}

export function SubtaskList({ parentTaskId }: SubtaskListProps) {
  const { t } = useTranslation(['tasks', 'common'])
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')

  const fetchSubtasks = async () => {
    if (window.api?.tasks?.getSubtasks) {
      const data = await window.api.tasks.getSubtasks(parentTaskId)
      setSubtasks(data)
    }
  }

  useEffect(() => {
    fetchSubtasks()
  }, [parentTaskId])

  const completedCount = subtasks.filter(t => t.completedAt || t.status === 'completed').length
  const total = subtasks.length
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100)

  const handleAdd = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTitle.trim()) {
      e.preventDefault()
      if (window.api?.tasks?.create) {
        await window.api.tasks.create({ title: newTitle.trim(), parentTaskId })
        setNewTitle('')
        fetchSubtasks()
      }
    }
  }

  const toggleComplete = async (id: string, current: boolean) => {
    // Optimistic update
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
    // Optimistic delete
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

      <div className="space-y-0.5 mt-2">
        {subtasks.map(task => {
          const isCompleted = !!task.completedAt || task.status === 'completed'
          return (
            <div key={task.id} className="flex items-center gap-2 group hover:bg-muted/40 px-1.5 py-1 rounded transition-colors text-xs">
              <Checkbox 
                checked={isCompleted} 
                onCheckedChange={() => toggleComplete(task.id, isCompleted)}
                className="h-3.5 w-3.5 rounded-[3px]"
              />
              <span className={`flex-1 text-xs truncate ${isCompleted ? 'line-through text-muted-foreground/80' : 'text-foreground'}`}>
                {task.title}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                title={t('common:actions.delete')}
                aria-label={t('common:actions.delete')}
                onClick={() => handleDelete(task.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )
        })}
      </div>

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
