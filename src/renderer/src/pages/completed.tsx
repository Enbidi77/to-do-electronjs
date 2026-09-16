import { useEffect, useState, useCallback } from 'react'
import { TaskList } from '@/components/task/task-list'
import type { Task } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTaskStore } from '@/stores/task-store'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export default function CompletedPage() {
  const { t } = useTranslation(['tasks', 'navigation', 'common', 'notifications', 'errors'])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      if (window.api?.tasks?.list) {
        const data = await window.api.tasks.list({
          filter: { status: 'completed' },
          sort: { field: 'updatedAt', direction: 'desc' }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load completed tasks', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (!completed) {
        await uncompleteTask(id)
        toast.info(t('notifications:taskReopened'))
        fetchTasks()
      }
    } catch {
      toast.error(t('errors:saveTaskFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common:dialogs.confirmDeleteTask'))) {
      try {
        await deleteTask(id)
        toast.success(t('notifications:taskDeleted'))
        fetchTasks()
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  const handleClearAll = async () => {
    if (tasks.length === 0) return
    if (window.confirm(t('common:dialogs.confirmClearAllCompleted', { count: tasks.length }))) {
      try {
        for (const task of tasks) {
          await deleteTask(task.id)
        }
        toast.success(t('notifications:allCompletedDeleted'))
        fetchTasks()
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-2 shrink-0 flex items-center justify-between border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t('navigation:completed')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('tasks:tasksCount', { count: tasks.length })}
          </p>
        </div>
        {tasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/15 border-border/70"
            onClick={handleClearAll}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t('common:actions.clearAll')}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-hidden p-6 pt-2">
        <TaskList
          tasks={tasks}
          isLoading={loading}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
