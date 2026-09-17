import { useState, useEffect } from 'react'
import type { Stage } from '@shared/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useStageStore } from '@/stores/stage-store'
import { toast } from 'sonner'
import {
  Circle,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  Star,
  Sparkles,
  Flag,
  Flame,
  Archive,
  Layers
} from 'lucide-react'

export const STAGE_ICONS: Record<string, typeof Circle> = {
  circle: Circle,
  clock: Clock,
  'check-circle-2': CheckCircle2,
  'alert-circle': AlertCircle,
  'play-circle': PlayCircle,
  'help-circle': HelpCircle,
  star: Star,
  sparkles: Sparkles,
  flag: Flag,
  flame: Flame,
  archive: Archive,
  layers: Layers
}

const STAGE_COLOR_PRESETS = [
  '#94a3b8', // slate
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#f59e0b', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#6366f1', // indigo
  '#14b8a6'  // teal
]

type StageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage?: Stage | null
  onSuccess?: (stage: Stage) => void
}

export function StageDialog({ open, onOpenChange, stage, onSuccess }: StageDialogProps) {
  const [name, setName] = useState(stage?.name || '')
  const [color, setColor] = useState(stage?.color || STAGE_COLOR_PRESETS[0])
  const [icon, setIcon] = useState(stage?.icon || 'circle')
  const [isCompleted, setIsCompleted] = useState(stage?.isCompleted || false)
  const [saving, setSaving] = useState(false)

  const createStage = useStageStore(s => s.createStage)
  const updateStage = useStageStore(s => s.updateStage)

  useEffect(() => {
    if (open) {
      setName(stage?.name || '')
      setColor(stage?.color || STAGE_COLOR_PRESETS[0])
      setIcon(stage?.icon || 'circle')
      setIsCompleted(stage?.isCompleted || false)
    }
  }, [open, stage])

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      if (stage) {
        const updated = await updateStage(stage.id, {
          name: name.trim(),
          color,
          icon,
          isCompleted
        })
        toast.success(`Stage "${name}" updated`)
        if (updated && onSuccess) onSuccess(updated)
      } else {
        const created = await createStage({
          name: name.trim(),
          color,
          icon,
          isCompleted
        })
        toast.success(`Stage "${name}" created`)
        if (created && onSuccess) onSuccess(created)
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save stage')
    } finally {
      setSaving(false)
    }
  }

  const CurrentIcon = STAGE_ICONS[icon] || Circle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <CurrentIcon
              className="h-4 w-4 shrink-0"
              style={{ color }}
            />
            {stage ? 'Edit Stage' : 'New Stage'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Stage Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="stage-name" className="text-xs font-medium text-foreground">
              Stage Name
            </Label>
            <Input
              id="stage-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. In Review, QA, Backlog"
              className="h-8 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !saving) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          {/* Color Selection */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-foreground">Color</Label>
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              {STAGE_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all border border-border/40 ${
                    color === hex ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                  title={hex}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-border/50 p-0 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>
          </div>

          {/* Icon Selection */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-foreground">Icon</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(STAGE_ICONS).map(([key, IconComp]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`p-1.5 rounded-md border transition-all ${
                    icon === key
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                  title={key}
                >
                  <IconComp className="h-4 w-4" style={{ color: icon === key ? color : undefined }} />
                </button>
              ))}
            </div>
          </div>

          {/* Is Completed Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="stage-completed" className="text-xs font-medium cursor-pointer">
                Treat as Completed Stage
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Tasks in this stage are marked as finished with completion timestamps.
              </p>
            </div>
            <Switch
              id="stage-completed"
              checked={isCompleted}
              onCheckedChange={setIsCompleted}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="h-8 text-xs"
          >
            {saving ? 'Saving...' : stage ? 'Save Changes' : 'Create Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
