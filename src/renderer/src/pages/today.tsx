import { useEffect, useState, useCallback } from 'react'
import { TaskList } from '@/components/task/task-list'
import type { Task, TaskStats } from '@shared/types'
import { useTranslation } from 'react-i18next'
import { useTaskStore } from '@/stores/task-store'
import { toast } from 'sonner'
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react'
import { formatHeaderDate } from '@/lib/date-format'

export default function TodayPage() {
  const { t } = useTranslation(['navigation', 'tasks', 'common', 'notifications', 'errors'])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const tasksVersion = useTaskStore(s => s.tasksVersion)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const todayStr = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    try {
      if (window.api?.tasks?.getStats) {
        const statsData = await window.api.tasks.getStats()
        setStats(statsData)
      }

      if (window.api?.tasks?.list) {
        // Fetch active tasks due today or overdue
        const data = await window.api.tasks.list({
          filter: {
            status: 'active',
            dueDateTo: todayStr
          },
          sort: {
            field: 'dueDate',
            direction: 'asc'
          }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load today data', err)
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    loadData()
  }, [loadData, tasksVersion])

  const handleComplete = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await completeTask(id)
        toast.success(t('notifications:taskCompleted'))
      } else {
        await uncompleteTask(id)
        toast.info(t('notifications:taskReopened'))
      }
      loadData()
    } catch {
      toast.error(t('errors:completeTaskFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common:dialogs.confirmDeleteTask'))) {
      try {
        await deleteTask(id)
        toast.success(t('notifications:taskDeleted'))
        loadData()
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 
    ? t('navigation:greetings.morning') 
    : hour < 18 
    ? t('navigation:greetings.afternoon') 
    : t('navigation:greetings.evening')

  const totalToday = (stats?.dueToday ?? 0) + (stats?.completed ?? 0)
  const completionPercent = totalToday > 0 ? Math.round(((stats?.completed ?? 0) / totalToday) * 100) : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{greeting}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{formatHeaderDate(new Date())}</p>
          </div>
          {totalToday > 0 && (
            <div className="text-right">
              <span className="text-[11px] font-medium text-muted-foreground">{t('tasks:todayProgress')}</span>
              <div className="text-base font-bold text-primary">{completionPercent}%</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalToday > 0 && (
          <div className="mt-2.5 w-full bg-muted/40 rounded-full h-1 overflow-hidden">
            <div
              className="bg-primary h-1 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3.5">
          <div className="p-3 rounded-lg border border-border/60 bg-card text-card-foreground flex items-center justify-between shadow-none">
            <div>
              <div className="text-lg font-semibold tracking-tight text-foreground">{stats?.dueToday ?? 0}</div>
              <span className="text-[11px] text-muted-foreground">{t('tasks:groups.today')}</span>
            </div>
            <div className="h-7 w-7 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card text-card-foreground flex items-center justify-between shadow-none">
            <div>
              <div className="text-lg font-semibold tracking-tight text-foreground">{stats?.completed ?? 0}</div>
              <span className="text-[11px] text-muted-foreground">{t('tasks:completed')}</span>
            </div>
            <div className="h-7 w-7 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card text-card-foreground flex items-center justify-between shadow-none">
            <div>
              <div className="text-lg font-semibold tracking-tight text-foreground">{stats?.overdue ?? 0}</div>
              <span className="text-[11px] text-muted-foreground">{t('tasks:groups.overdue')}</span>
            </div>
            <div className="h-7 w-7 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-card text-card-foreground flex items-center justify-between shadow-none">
            <div>
              <div className="text-lg font-semibold tracking-tight text-foreground">{stats?.dueThisWeek ?? 0}</div>
              <span className="text-[11px] text-muted-foreground">{t('navigation:upcoming')}</span>
            </div>
            <div className="h-7 w-7 rounded-md bg-muted/40 text-muted-foreground flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-warning" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 flex-1 overflow-hidden pb-3">
        <TaskList
          title={`${t('tasks:groups.today')} & ${t('tasks:groups.overdue')}`}
          tasks={tasks}
          isLoading={loading}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
