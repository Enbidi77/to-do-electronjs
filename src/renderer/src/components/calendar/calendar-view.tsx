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
import { DroppableContainer } from '@/components/drag-drop/DroppableContainer'
import { useTaskDnd } from '@/components/drag-drop/TaskDndContext'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarView() {
  const { t } = useTranslation(['tasks', 'common', 'notifications', 'errors'])
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const tasksVersion = useTaskStore(s => s.tasksVersion)
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
  }, [fetchTasksForDate, tasksVersion])

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

  const { isDragging } = useTaskDnd()

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background overflow-hidden">
      <div className="p-4 border-b lg:border-b-0 lg:border-r border-border/60 flex flex-col items-center justify-start shrink-0 bg-sidebar gap-3">
        <CalendarUI
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-lg border border-border/60 shadow-none bg-card"
        />

        {dateStr && (
          <DroppableContainer
            id={`date:${dateStr}`}
            className="w-full rounded-lg border border-dashed border-border/70 p-3 text-center transition-all"
            activeClassName="border-primary bg-primary/15 ring-2 ring-primary/30"
          >
            {(isOver) => (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                <span>
                  {isDragging && isOver
                    ? `Drop to schedule for ${dateStr}`
                    : `Drop task here to schedule for ${dateStr}`}
                </span>
              </div>
            )}
          </DroppableContainer>
        )}
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
