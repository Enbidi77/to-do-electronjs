import { useEffect, useState, useCallback } from 'react'
import { TaskEditor } from '@/components/task/task-editor'
import { TaskList } from '@/components/task/task-list'
import { TaskBoard } from '@/components/task/task-board'
import type { Task, TaskStatus } from '@shared/types'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '@/stores/task-store'
import { useUiStore } from '@/stores/ui-store'
import { toast } from 'sonner'

export default function InboxPage() {
  const { t } = useTranslation(['navigation', 'notifications', 'errors', 'common'])
  const tasks = useTaskStore(s => s.tasks)
  const setTasks = useTaskStore(s => s.setTasks)
  const [loading, setLoading] = useState(true)
  const tasksVersion = useTaskStore(s => s.tasksVersion)
  const taskViewMode = useUiStore(s => s.taskViewMode)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const fetchTasks = useCallback(async () => {
    try {
      if (window.api?.tasks?.list) {
        const statusFilter: TaskStatus[] = taskViewMode === 'board'
          ? ['active', 'in_progress', 'completed']
          : ['active', 'in_progress']

        const data = await window.api.tasks.list({
          filter: { status: statusFilter, projectId: null },
          sort: { field: 'sortOrder', direction: 'desc' }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load inbox tasks', err)
    } finally {
      setLoading(false)
    }
  }, [taskViewMode, setTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks, tasksVersion, taskViewMode])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(id)
        toast.success(t('notifications:taskCompleted'))
      } else {
        await uncompleteTask(id)
      }
      fetchTasks()
    } catch {
      toast.error(t('errors:completeTaskFailed'))
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-2 shrink-0">
        <h1 className="text-xl font-bold tracking-tight mb-3 text-foreground">{t('navigation:inbox')}</h1>
        <TaskEditor onCreated={fetchTasks} />
      </div>
      <div className="flex-1 overflow-hidden p-5 pt-2">
        {taskViewMode === 'board' ? (
          <TaskBoard
            tasks={tasks}
            onComplete={handleComplete}
            onDelete={handleDelete}
            title={t('navigation:inbox')}
          />
        ) : (
          <TaskList
            tasks={tasks}
            isLoading={loading}
            onComplete={handleComplete}
            onDelete={handleDelete}
            title={t('navigation:inbox')}
          />
        )}
      </div>
    </div>
  )
}
