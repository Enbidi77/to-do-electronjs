import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useTaskStore } from '@/stores/task-store'
import { useProjectStore } from '@/stores/project-store'
import type { TaskWithRelations, TaskPriority } from '@shared/types'
import { Trash2, Archive, CheckCircle2, Calendar, Folder, Flag } from 'lucide-react'
import { SubtaskList } from './subtask-list'
import { TaskPrioritySelector } from './task-priority'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatLocalized } from '@/lib/date-format'

export function TaskDetails() {
  const { t } = useTranslation(['tasks', 'common', 'projects', 'notifications', 'errors', 'navigation'])
  const { detailsPanelOpen, setDetailsPanelOpen, selectedTaskId } = useUiStore()
  const [task, setTask] = useState<TaskWithRelations | null>(null)
  const projects = useProjectStore(s => s.projects)
  const updateTask = useTaskStore(s => s.updateTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const completeTask = useTaskStore(s => s.completeTask)
  const archiveTask = useTaskStore(s => s.archiveTask)

  useEffect(() => {
    if (detailsPanelOpen && selectedTaskId) {
      window.api?.tasks?.get(selectedTaskId)
        .then(setTask)
        .catch(err => {
          console.error('Failed to load task', err)
          toast.error(t('errors:loadDetailsFailed'))
        })
    } else {
      setTask(null)
    }
  }, [detailsPanelOpen, selectedTaskId, t])

  if (!task) return null

  const handleTitleChange = (newTitle: string) => {
    setTask({ ...task, title: newTitle })
    updateTask(task.id, { title: newTitle }).catch(console.error)
  }

  const handleDescriptionChange = (newDesc: string) => {
    setTask({ ...task, description: newDesc })
    updateTask(task.id, { description: newDesc }).catch(console.error)
  }

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setTask({ ...task, priority: newPriority })
    updateTask(task.id, { priority: newPriority }).catch(console.error)
  }

  const handleProjectChange = (projectId: string) => {
    const pId = projectId === 'none' ? null : projectId
    setTask({ ...task, projectId: pId })
    updateTask(task.id, { projectId: pId }).catch(console.error)
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value || null
    setTask({ ...task, dueDate: val })
    updateTask(task.id, { dueDate: val }).catch(console.error)
  }

  const handleComplete = async () => {
    try {
      await completeTask(task.id)
      toast.success(t('notifications:taskCompleted'))
      setDetailsPanelOpen(false)
    } catch {
      toast.error(t('errors:completeTaskFailed'))
    }
  }

  const handleArchive = async () => {
    try {
      await archiveTask(task.id)
      toast.success(t('notifications:taskArchived'))
      setDetailsPanelOpen(false)
    } catch {
      toast.error(t('errors:archiveTaskFailed'))
    }
  }

  const handleDelete = async () => {
    if (window.confirm(t('common:dialogs.confirmDeleteTask'))) {
      try {
        await deleteTask(task.id)
        toast.success(t('notifications:taskDeleted'))
        setDetailsPanelOpen(false)
      } catch {
        toast.error(t('errors:deleteTaskFailed'))
      }
    }
  }

  return (
    <Sheet open={detailsPanelOpen} onOpenChange={setDetailsPanelOpen}>
      <SheetContent className="w-[420px] sm:w-[540px] flex flex-col p-0 bg-card border-l border-border/80 shadow-2xl" side="right">
        <SheetHeader className="p-3.5 border-b border-border/60 shrink-0 flex flex-row items-center justify-between space-y-0 bg-muted/30">
          <SheetTitle className="sr-only">{t('tasks:details')}</SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={task.status === 'completed' ? 'secondary' : 'default'}
              size="sm"
              className="gap-1.5 h-8 text-xs font-medium"
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {task.status === 'completed' ? t('tasks:completed') : t('tasks:complete')}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              title={t('tasks:archive')}
              aria-label={t('tasks:archive')}
              onClick={handleArchive}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:bg-destructive/15"
              title={t('tasks:delete')}
              aria-label={t('tasks:delete')}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          <div>
            <Input
              value={task.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-base font-semibold border-none focus-visible:ring-0 px-0 h-auto shadow-none text-foreground bg-transparent"
              placeholder={t('tasks:titlePlaceholder')}
            />
          </div>

          <div>
            <Textarea
              value={task.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder={t('tasks:descriptionPlaceholder')}
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 px-0 text-xs shadow-none text-muted-foreground focus:text-foreground bg-transparent"
            />
          </div>

          {/* Properties grid */}
          <div className="space-y-2.5 pt-3 border-t border-border/60 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                <span>{t('projects:project')}</span>
              </div>
              <Select value={task.projectId || 'none'} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-[170px] h-7 text-xs border-border/70 bg-muted/30">
                  <SelectValue placeholder={t('navigation:inbox')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('navigation:inbox')}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#8ab4f8' }} />
                        <span className="truncate">{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-3.5 w-3.5" />
                <span>{t('tasks:priority')}</span>
              </div>
              <TaskPrioritySelector value={task.priority} onChange={handlePriorityChange} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('tasks:dueDate')}</span>
              </div>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={handleDueDateChange}
                className="h-7 rounded-md border border-border/70 bg-muted/30 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="pt-3 border-t border-border/60">
            <SubtaskList parentTaskId={task.id} />
          </div>
        </div>

        <div className="p-3.5 border-t border-border/60 text-[11px] text-muted-foreground shrink-0 flex justify-between items-center bg-muted/30">
          <span>
            {task.createdAt ? `${t('common:appName')}: ${formatLocalized(task.createdAt, 'PP')}` : ''}
          </span>
          {task.completedAt && (
            <span className="text-success font-medium">
              {t('tasks:completed')}: {formatLocalized(task.completedAt, 'PP')}
            </span>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
