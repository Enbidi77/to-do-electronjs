import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { useTaskStore } from '@/stores/task-store'
import { toast } from 'sonner'

type TaskEditorProps = {
  projectId?: string | null
  onCreated?: () => void
}

export function TaskEditor({ projectId = null, onCreated }: TaskEditorProps) {
  const { t } = useTranslation(['tasks', 'notifications', 'errors'])
  const [title, setTitle] = useState('')
  const createTask = useTaskStore(s => s.createTask)

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      e.preventDefault()
      const taskTitle = title.trim()
      setTitle('')
      try {
        await createTask({ title: taskTitle, projectId })
        toast.success(t('notifications:taskCreated'))
        onCreated?.()
      } catch (err) {
        console.error('Failed to create task', err)
        setTitle(taskTitle)
        toast.error(t('errors:saveTaskFailed'))
      }
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-border/80 rounded-md bg-card focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-none">
      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('tasks:addPlaceholder')}
        className="border-none focus-visible:ring-0 shadow-none px-0 h-auto py-0.5 text-xs text-foreground placeholder:text-muted-foreground"
      />
    </div>
  )
}
