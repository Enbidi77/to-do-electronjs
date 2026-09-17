import type { ReactNode } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '@/components/ui/context-menu'
import type { Task, TaskPriority, TaskStatus } from '@shared/types'
import { PRIORITY_CONFIG } from '@shared/constants'
import {
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  Circle,
  Flag,
  Folder,
  ArrowUp,
  ArrowDown,
  Calendar,
  Layers,
  Inbox
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTaskStore } from '@/stores/task-store'
import { useProjectStore } from '@/stores/project-store'
import { useStageStore } from '@/stores/stage-store'
import { STAGE_ICONS } from '@/components/stage/stage-dialog'
import { toast } from 'sonner'
import { addDays, format } from 'date-fns'

type TaskContextMenuProps = {
  task: Task
  children: ReactNode
}

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low', 'none']

export function TaskContextMenu({ task, children }: TaskContextMenuProps) {
  const { t } = useTranslation(['tasks', 'common', 'notifications', 'errors'])
  const openDetails = useUiStore(s => s.openDetails)
  const confirmBeforeDelete = useSettingsStore(s => s.settings.confirmBeforeDelete)
  const completeTask = useTaskStore(s => s.completeTask)
  const uncompleteTask = useTaskStore(s => s.uncompleteTask)
  const updateTask = useTaskStore(s => s.updateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const archiveTask = useTaskStore(s => s.archiveTask)
  const moveTask = useTaskStore(s => s.moveTask)
  const changeTaskStatus = useTaskStore(s => s.changeTaskStatus)
  const reorderTask = useTaskStore(s => s.reorderTask)
  const allTasks = useTaskStore(s => s.tasks)
  const projects = useProjectStore(s => s.projects)
  const stages = useStageStore(s => s.stages)

  const handleToggleComplete = async () => {
    try {
      if (task.completedAt) {
        await uncompleteTask(task.id)
        toast.info(t('notifications:taskReopened'))
      } else {
        await completeTask(task.id)
        toast.success(t('notifications:taskCompleted'))
      }
    } catch {
      toast.error(t('errors:completeTaskFailed'))
    }
  }

  const handleDelete = async () => {
    if (confirmBeforeDelete) {
      if (!window.confirm(t('common:dialogs.confirmDeleteTask'))) return
    }
    try {
      await deleteTask(task.id)
      toast.success(t('notifications:taskDeleted'))
    } catch {
      toast.error(t('errors:deleteTaskFailed'))
    }
  }

  const handleArchive = async () => {
    try {
      await archiveTask(task.id)
      toast.success(t('notifications:taskArchived'))
    } catch {
      toast.error(t('errors:archiveTaskFailed'))
    }
  }

  const handleSetPriority = async (priority: TaskPriority) => {
    try {
      await updateTask(task.id, { priority })
      const pLabel = t(`tasks:priorities.${priority}`)
      toast.success(t('notifications:prioritySet', { priority: pLabel }))
    } catch {
      toast.error(t('errors:updatePriorityFailed'))
    }
  }

  const handleMoveToProject = async (projectId: string | null) => {
    try {
      await moveTask({ taskId: task.id, targetProjectId: projectId })
      const name = projectId ? projects.find(p => p.id === projectId)?.name : 'Inbox'
      toast.success(`Moved to ${name}`)
    } catch {
      toast.error('Failed to move task')
    }
  }

  const handleChangeStatus = async (status: TaskStatus) => {
    try {
      await changeTaskStatus({ taskId: task.id, status })
      toast.success(`Status updated to ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleMoveDate = async (dateStr: string | null) => {
    try {
      await updateTask(task.id, { dueDate: dateStr })
      toast.success(dateStr ? `Due date set to ${dateStr}` : 'Due date cleared')
    } catch {
      toast.error('Failed to update due date')
    }
  }

  const handleMoveToTop = async () => {
    try {
      const siblings = allTasks.filter(
        t => t.parentTaskId === task.parentTaskId && t.projectId === task.projectId
      )
      const maxOrder = Math.max(0, ...siblings.map(t => t.sortOrder ?? 0))
      await reorderTask({ taskId: task.id, targetSortOrder: maxOrder + 1000 })
      toast.success('Moved to top')
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const handleMoveToBottom = async () => {
    try {
      const siblings = allTasks.filter(
        t => t.parentTaskId === task.parentTaskId && t.projectId === task.projectId
      )
      const minOrder = Math.min(...siblings.map(t => t.sortOrder ?? 0))
      await reorderTask({ taskId: task.id, targetSortOrder: Math.max(0, minOrder - 1000) })
      toast.success('Moved to bottom')
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 text-xs">
        <ContextMenuItem onClick={() => openDetails(task.id)} className="gap-2">
          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{t('tasks:contextMenu.editDetails')}</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleToggleComplete} className="gap-2">
          {task.completedAt ? (
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <span>{task.completedAt ? t('tasks:reopen') : t('tasks:markCompleted')}</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Change Stage</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 text-xs">
            {stages.length > 0 ? (
              stages.map((stage) => {
                const IconComp = (stage.icon && STAGE_ICONS[stage.icon]) || Circle
                const isCurrent = task.status === stage.id
                return (
                  <ContextMenuItem
                    key={stage.id}
                    onClick={() => handleChangeStatus(stage.id)}
                    className={`gap-2 ${isCurrent ? 'font-semibold text-primary' : ''}`}
                  >
                    <IconComp className="h-3 w-3 shrink-0" style={{ color: stage.color }} />
                    <span className="truncate">{stage.name}</span>
                  </ContextMenuItem>
                )
              })
            ) : (
              <>
                <ContextMenuItem onClick={() => handleChangeStatus('active')} className="gap-2">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  <span>To Do</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeStatus('in_progress')} className="gap-2">
                  <Circle className="h-3 w-3 text-amber-500" />
                  <span>In Progress</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeStatus('completed')} className="gap-2">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  <span>Done</span>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Move to Project</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 text-xs">
            <ContextMenuItem onClick={() => handleMoveToProject(null)} className="gap-2">
              <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Inbox</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            {projects.map(p => (
              <ContextMenuItem key={p.id} onClick={() => handleMoveToProject(p.id)} className="gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color || '#8ab4f8' }}
                />
                <span className="truncate">{p.name}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Move to Date</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-36 text-xs">
            <ContextMenuItem onClick={() => handleMoveDate(todayStr)} className="gap-2">
              <span>Today</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleMoveDate(tomorrowStr)} className="gap-2">
              <span>Tomorrow</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleMoveDate(null)} className="gap-2 text-muted-foreground">
              <span>Clear Date</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleMoveToTop} className="gap-2">
          <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Move to Top</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleMoveToBottom} className="gap-2">
          <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Move to Bottom</span>
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Flag className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t('tasks:contextMenu.setPriority')}</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40 text-xs">
            {PRIORITIES.map(p => {
              const cfg = PRIORITY_CONFIG[p]
              const pLabel = t(`tasks:priorities.${p}`, { defaultValue: cfg.label })
              return (
                <ContextMenuItem key={p} onClick={() => handleSetPriority(p)} className="gap-2">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: cfg.color }} 
                  />
                  <span>{pLabel}</span>
                </ContextMenuItem>
              )
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleArchive} className="gap-2">
          <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{t('common:actions.archive')}</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          <span>{t('common:actions.delete')}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
