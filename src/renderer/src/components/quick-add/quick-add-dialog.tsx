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
    <div className="bg-card rounded-xl shadow-2xl border border-border/80 flex flex-col overflow-hidden w-full">
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('tasks:quickAddPlaceholder')}
        className="text-sm border-0 focus-visible:ring-0 p-4 h-auto shadow-none text-foreground placeholder:text-muted-foreground"
        autoFocus
      />

      {input.trim() && (
        <div className="bg-muted/30 p-2.5 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-foreground font-medium truncate max-w-[180px]">
            {parsed.title || '...'}
          </span>

          {parsed.dueDate && (
            <Badge variant="outline" className="gap-1 bg-background text-[11px] h-5 border-border/80">
              <Calendar className="h-3 w-3 text-blue-500" />
              {formatRelativeDueDate(parsed.dueDate)}
              {parsed.dueTime && ` lúc ${parsed.dueTime}`}
            </Badge>
          )}

          {parsed.projectName && (
            <Badge variant="outline" className="gap-1 bg-background text-[11px] h-5 border-border/80">
              <Folder className="h-3 w-3 text-emerald-500" />
              {parsed.projectName}
            </Badge>
          )}

          {parsed.tags.map(tag => (
            <Badge key={tag} variant="outline" className="gap-1 bg-background text-[11px] h-5 border-border/80">
              <TagIcon className="h-3 w-3 text-amber-500" />
              {tag}
            </Badge>
          ))}

          {parsed.priority !== 'none' && (
            <Badge variant="outline" className="gap-1 bg-background text-[11px] h-5 border-border/80">
              <Flag className="h-3 w-3 text-rose-500" />
              {t(`tasks:priorities.${parsed.priority}`)}
            </Badge>
          )}

          <div className="flex-1" />
          <span className="text-[10px] text-muted-foreground/70">
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
