import React, { useState } from 'react'
import { Project } from '@shared/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PROJECT_COLORS } from '@shared/constants'
import { useProjectStore } from '@/stores/project-store'
import { useTranslation } from 'react-i18next'

type ProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const { t } = useTranslation(['projects', 'common'])
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0])
  
  const fetchProjects = useProjectStore(s => s.fetchProjects)

  // Reset state when opened with a different project
  React.useEffect(() => {
    if (open) {
      setName(project?.name || '')
      setDescription(project?.description || '')
      setColor(project?.color || PROJECT_COLORS[0])
    }
  }, [open, project])

  const handleSave = async () => {
    if (!name.trim()) return

    try {
      if (project && window.api?.projects?.update) {
        await window.api.projects.update(project.id, { name: name.trim(), description: description.trim() || undefined, color })
      } else if (window.api?.projects?.create) {
        await window.api.projects.create({ name: name.trim(), description: description.trim() || undefined, color })
      }
      fetchProjects()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {project ? t('projects:edit') : t('projects:create')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground">{t('projects:name')}</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('projects:namePlaceholder')}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground">{t('projects:description')}</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder={t('projects:descriptionPlaceholder')}
              className="resize-none min-h-[60px] text-xs" 
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-foreground">{t('projects:color')}</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PROJECT_COLORS.map((hex) => (
                <button
                  key={hex}
                  className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${color === hex ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                  type="button"
                  aria-label={hex}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            {t('common:actions.cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()} className="h-8 text-xs">
            {t('common:actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
