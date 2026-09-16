import { useState, useEffect, useCallback } from 'react'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { TaskList } from '../task/task-list'
import { TaskEditor } from '../task/task-editor'
import type { Task } from '@shared/types'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '@/stores/task-store'
import { toast } from 'sonner'
import { formatFullDate } from '@/lib/date-format'

export default function CalendarView() {
  const { t } = useTranslation(['tasks', 'common', 'notifications', 'errors'])
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const dateStr = date ? format(date, 'yyyy-MM-dd') : null

  const fetchTasksForDate = useCallback(async () => {
    if (!dateStr || !window.api?.tasks?.list) {
      setTasks([])
      return
    }

    try {
      setLoading(true)
      const data = await window.api.tasks.list({
        filter: {
          dueDateFrom: dateStr,
          dueDateTo: dateStr
        }
      })
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks for date', err)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => {
    fetchTasksForDate()
  }, [fetchTasksForDate])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(id)
        toast.success(t('notifications:taskCompleted'))
      } else {
        await uncompleteTask(id)
      }
      fetchTasksForDate()
    } catch {
      toast.error(t('errors:completeTaskFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common:dialogs.confirmDeleteTask'))) {
      try {
        await deleteTask(id)
        toast.success(t('notifications:taskDeleted'))
        fetchTasksForDate()
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background overflow-hidden">
      <div className="p-4 border-b lg:border-b-0 lg:border-r border-border/60 flex justify-center shrink-0 bg-sidebar">
        <CalendarUI
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border border-border/60 shadow-none bg-card"
        />
      </div>
      <div className="flex-1 overflow-hidden p-5 flex flex-col">
        <div className="mb-3">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {date ? `${t('tasks:tasks')} - ${formatFullDate(date)}` : t('tasks:selectDate')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('tasks:tasksScheduled', { count: tasks.length })}
          </p>
        </div>

        {dateStr && (
          <div className="mb-3">
            <TaskEditor onCreated={fetchTasksForDate} />
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <TaskList
            tasks={tasks}
            isLoading={loading}
            onComplete={handleComplete}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}
