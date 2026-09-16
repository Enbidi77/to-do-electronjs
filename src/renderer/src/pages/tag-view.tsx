import { useEffect, useState, useCallback } from 'react'
import { TaskList } from '@/components/task/task-list'
import type { Task } from '@shared/types'
import { useUiStore } from '@/stores/ui-store'
import { useTagStore } from '@/stores/tag-store'
import { useTaskStore } from '@/stores/task-store'
import { Badge } from '@/components/ui/badge'
import { Tag as TagIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export default function TagViewPage() {
  const { t } = useTranslation(['navigation', 'tasks', 'common', 'notifications', 'errors'])
  const currentTagId = useUiStore(s => s.currentTagId)
  const tag = useTagStore(s => s.tags.find(t => t.id === currentTagId))
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!currentTagId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      if (window.api?.tasks?.list) {
        const data = await window.api.tasks.list({
          filter: { status: 'active', tagId: currentTagId },
          sort: { field: 'sortOrder', direction: 'desc' }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load tagged tasks', err)
    } finally {
      setLoading(false)
    }
  }, [currentTagId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(id)
        toast.success(t('notifications:taskCompleted'))
      } else {
        await uncompleteTask(id)
        toast.info(t('notifications:taskReopened'))
      }
      fetchTasks()
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

  if (!tag) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-muted-foreground">
        <TagIcon className="h-8 w-8 mr-2 opacity-50" />
        <span>{t('navigation:selectTag')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-2 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Badge
            variant="outline"
            className="text-xs py-0.5 px-2.5 font-medium rounded-md border-border/60 bg-muted/40 text-foreground"
          >
            #{tag.name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t('tasks:tasksCount', { count: tasks.length })}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-5 pt-2">
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
