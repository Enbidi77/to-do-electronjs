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
import type { Task, TaskPriority } from '@shared/types'
import { PRIORITY_CONFIG } from '@shared/constants'
import { Edit, Trash2, Archive, CheckCircle, Circle, Flag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTaskStore } from '@/stores/task-store'
import { toast } from 'sonner'

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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52 text-xs">
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
