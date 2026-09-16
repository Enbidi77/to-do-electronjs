import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Task } from '@shared/types'
import { isToday, isTomorrow, isThisWeek, isBefore, startOfToday, addWeeks, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '@/stores/task-store'
import { useUiStore } from '@/stores/ui-store'
import { TaskItem } from '@/components/task/task-item'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'

interface TaskGroup {
  id: string
  title: string
  tasks: Task[]
}

export default function UpcomingPage() {
  const { t } = useTranslation(['tasks', 'navigation', 'notifications', 'errors', 'common'])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const selectedTaskId = useUiStore(s => s.selectedTaskId)
  const openDetails = useUiStore(s => s.openDetails)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      if (window.api?.tasks?.list) {
        const data = await window.api.tasks.list({
          filter: { status: 'active' },
          sort: { field: 'dueDate', direction: 'asc' }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load upcoming tasks', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(id)
        toast.success(t('notifications:taskCompleted'))
      } else {
        await uncompleteTask(id)
        toast.info(t('notifications:taskReopened'))
      }
      loadTasks()
    } catch {
      toast.error(t('errors:saveTaskFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common:dialogs.confirmDeleteTask'))) {
      try {
        await deleteTask(id)
        toast.success(t('notifications:taskDeleted'))
        loadTasks()
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  const groups = useMemo(() => {
    const today = startOfToday()
    const twoWeeksOut = addWeeks(today, 2)

    const overdue: Task[] = []
    const todayTasks: Task[] = []
    const tomorrowTasks: Task[] = []
    const thisWeekTasks: Task[] = []
    const nextWeekTasks: Task[] = []
    const laterTasks: Task[] = []
    const noDateTasks: Task[] = []

    for (const tsk of tasks) {
      if (!tsk.dueDate) {
        noDateTasks.push(tsk)
        continue
      }

      const date = parseISO(tsk.dueDate)

      if (isBefore(date, today)) {
        overdue.push(tsk)
      } else if (isToday(date)) {
        todayTasks.push(tsk)
      } else if (isTomorrow(date)) {
        tomorrowTasks.push(tsk)
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        thisWeekTasks.push(tsk)
      } else if (isBefore(date, twoWeeksOut)) {
        nextWeekTasks.push(tsk)
      } else {
        laterTasks.push(tsk)
      }
    }

    const result: TaskGroup[] = []
    if (overdue.length > 0) result.push({ id: 'overdue', title: t('tasks:groups.overdue'), tasks: overdue })
    if (todayTasks.length > 0) result.push({ id: 'today', title: t('tasks:groups.today'), tasks: todayTasks })
    if (tomorrowTasks.length > 0) result.push({ id: 'tomorrow', title: t('tasks:groups.tomorrow'), tasks: tomorrowTasks })
    if (thisWeekTasks.length > 0) result.push({ id: 'this-week', title: t('tasks:groups.thisWeek'), tasks: thisWeekTasks })
    if (nextWeekTasks.length > 0) result.push({ id: 'next-week', title: t('tasks:groups.nextWeek'), tasks: nextWeekTasks })
    if (laterTasks.length > 0) result.push({ id: 'later', title: t('tasks:groups.later'), tasks: laterTasks })
    if (noDateTasks.length > 0) result.push({ id: 'no-date', title: t('tasks:groups.noDate'), tasks: noDateTasks })

    return result
  }, [tasks, t])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-3 border-b shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">{t('navigation:upcoming')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('tasks:tasksScheduled', { count: tasks.length })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={CalendarIcon}
              title={t('tasks:emptyTitle')}
              description={t('tasks:emptyDescription')}
            />
          </div>
        ) : (
          groups.map(group => (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <h2
                  className={`text-xs font-medium tracking-wide ${
                    group.id === 'overdue' ? 'text-destructive font-semibold' : 'text-foreground'
                  }`}
                >
                  {group.title}
                </h2>
                <span className="text-[11px] text-muted-foreground">{group.tasks.length}</span>
              </div>
              <div className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden bg-card">
                {group.tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onSelect={openDetails}
                    isSelected={selectedTaskId === task.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
