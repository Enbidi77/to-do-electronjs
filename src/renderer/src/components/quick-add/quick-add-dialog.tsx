import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/stores/ui-store'
import { useTaskStore } from '@/stores/task-store'
import { useProjectStore } from '@/stores/project-store'
import { Badge } from '@/components/ui/badge'
import { Calendar, Tag as TagIcon, Flag, Folder } from 'lucide-react'
import { toast } from 'sonner'
import { parseTaskInput } from '@/lib/date-parser'
import { formatRelativeDueDate } from '@/lib/date-format'
import { format } from 'date-fns'

interface QuickAddDialogProps {
  standalone?: boolean
}

export function QuickAddDialog({ standalone = false }: QuickAddDialogProps) {
  const { t } = useTranslation(['tasks', 'common', 'notifications', 'errors'])
  const { quickAddOpen, setQuickAddOpen } = useUiStore()
  const [input, setInput] = useState('')
  const projects = useProjectStore(s => s.projects)
  const createTask = useTaskStore(s => s.createTask)

  const parsed = parseTaskInput(input)

  useEffect(() => {
    if (quickAddOpen || standalone) {
      setInput('')
    }
  }, [quickAddOpen, standalone])

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && standalone) {
      if (window.todo?.window?.close) {
        window.todo.window.close()
      } else if (window.api?.app?.close) {
        window.api.app.close()
      }
      return
    }

    if (e.key === 'Enter' && parsed.title.trim()) {
      e.preventDefault()
      try {
        let projectId: string | null = null
        if (parsed.projectName) {
          const matchedProject = projects.find(
            p => p.name.toLowerCase() === parsed.projectName?.toLowerCase()
          )
          if (matchedProject) {
            projectId = matchedProject.id
          }
        }

        const dueDateStr = parsed.dueDate ? format(parsed.dueDate, 'yyyy-MM-dd') : null

        await createTask({
          title: parsed.title.trim(),
          priority: parsed.priority,
          projectId,
          dueDate: dueDateStr,
          dueTime: parsed.dueTime,
        })

        toast.success(t('notifications:taskCreated'))
        setInput('')
        
        if (standalone) {
          if (window.todo?.window?.close) {
            window.todo.window.close()
          } else if (window.api?.app?.close) {
            window.api.app.close()
          }
        } else {
          setQuickAddOpen(false)
        }
      } catch {
        toast.error(t('errors:saveTaskFailed'))
      }
    }
  }

  const content = (
    <div className="bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden w-full">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('tasks:quickAddPlaceholder')}
        className="text-sm border-0 focus-visible:ring-0 p-4 h-auto shadow-none text-foreground placeholder:text-muted-foreground bg-transparent"
        autoFocus
      />

      {input.trim() && (
        <div className="bg-muted/40 p-2.5 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-foreground font-medium truncate max-w-[180px]">
            {parsed.title || '...'}
          </span>

          {parsed.dueDate && (
            <Badge variant="outline" className="gap-1 bg-muted/30 text-[11px] h-5 border-border/60 text-foreground font-normal">
              <Calendar className="h-3 w-3 text-primary" />
              {formatRelativeDueDate(parsed.dueDate)}
              {parsed.dueTime && ` ${parsed.dueTime}`}
            </Badge>
          )}

          {parsed.projectName && (
            <Badge variant="outline" className="gap-1 bg-muted/30 text-[11px] h-5 border-border/60 text-foreground font-normal">
              <Folder className="h-3 w-3 text-success" />
              {parsed.projectName}
            </Badge>
          )}

          {parsed.tags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1 bg-muted/30 text-[11px] h-5 border-border/60 text-foreground font-normal">
              <TagIcon className="h-3 w-3 text-warning" />
              {tag}
            </Badge>
          ))}

          {parsed.priority !== 'none' && (
            <Badge variant="outline" className="gap-1 bg-muted/30 text-[11px] h-5 border-border/60 text-foreground font-normal">
              <Flag className="h-3 w-3 text-destructive" />
              {t(`tasks:priorities.${parsed.priority}`)}
            </Badge>
          )}

          <div className="flex-1" />
          <span className="text-[10px] text-muted-foreground/80">
            {t('common:shortcuts.pressEnterToSave')} • {t('common:shortcuts.escToCancel')}
          </span>
        </div>
      )}
    </div>
  )

  if (standalone) {
    return <div className="p-2 w-full h-full flex items-center justify-center">{content}</div>
  }

  return (
    <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  )
}
