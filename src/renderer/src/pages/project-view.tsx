import { useEffect, useState, useCallback } from 'react'
import { TaskList } from '@/components/task/task-list'
import { TaskBoard } from '@/components/task/task-board'
import { TaskEditor } from '@/components/task/task-editor'
import type { TaskStatus } from '@shared/types'
import { useUiStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { useTaskStore } from '@/stores/task-store'
import { useStageStore } from '@/stores/stage-store'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Folder } from 'lucide-react'

export default function ProjectViewPage() {
  const { t } = useTranslation(['projects', 'tasks', 'common', 'notifications', 'errors'])
  const currentProjectId = useUiStore(s => s.currentProjectId)
  const taskViewMode = useUiStore(s => s.taskViewMode)
  const project = useProjectStore(s => s.projects.find(p => p.id === currentProjectId))
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const tasksVersion = useTaskStore(s => s.tasksVersion)
  const stages = useStageStore(s => s.stages)

  const tasks = useTaskStore(s => s.tasks)
  const setTasks = useTaskStore(s => s.setTasks)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!currentProjectId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      if (window.api?.tasks?.list) {
        const statusFilter: TaskStatus[] = taskViewMode === 'board'
          ? (stages.length > 0 ? stages.map(s => s.id) : ['active', 'in_progress', 'completed'])
          : (stages.length > 0 ? stages.filter(s => !s.isCompleted).map(s => s.id) : ['active', 'in_progress'])

        const data = await window.api.tasks.list({
          filter: { status: statusFilter, projectId: currentProjectId },
          sort: { field: 'sortOrder', direction: 'desc' }
        })
        setTasks(data)
      }
    } catch (err) {
      console.error('Failed to load project tasks', err)
    } finally {
      setLoading(false)
    }
  }, [currentProjectId, taskViewMode, stages, setTasks])

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

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-muted-foreground">
        <Folder className="h-8 w-8 mr-2 opacity-50" />
        <span>{t('projects:selectProject')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-5 pb-2 shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#8ab4f8' }}
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <TaskEditor projectId={project.id} onCreated={fetchTasks} />
      </div>
      <div className="flex-1 overflow-hidden p-5 pt-2">
        {taskViewMode === 'board' ? (
          <TaskBoard
            tasks={tasks}
            onComplete={handleComplete}
            onDelete={handleDelete}
            title={project.name}
          />
        ) : (
          <TaskList
            tasks={tasks}
            isLoading={loading}
            onComplete={handleComplete}
            onDelete={handleDelete}
            title={project.name}
          />
        )}
      </div>
    </div>
  )
}
