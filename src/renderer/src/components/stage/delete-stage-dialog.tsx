import React, { useState } from 'react'
import type { Stage } from '@shared/types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useStageStore } from '@/stores/stage-store'
import { useTaskStore } from '@/stores/task-store'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

type DeleteStageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage: Stage | null
  onDeleted?: () => void
}

export function DeleteStageDialog({ open, onOpenChange, stage, onDeleted }: DeleteStageDialogProps) {
  const stages = useStageStore(s => s.stages)
  const deleteStage = useStageStore(s => s.deleteStage)
  const allTasks = useTaskStore(s => s.tasks)
  const notifyTaskChanged = useTaskStore(s => s.notifyTaskChanged)

  const otherStages = stages.filter(s => s.id !== stage?.id)
  const [targetFallbackId, setTargetFallbackId] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  // Calculate affected tasks count
  const affectedTasksCount = stage
    ? allTasks.filter(t => t.status === stage.id).length
    : 0

  React.useEffect(() => {
    if (open && otherStages.length > 0) {
      // Pick first active or non-completed stage by default
      const defaultStage = otherStages.find(s => !s.isCompleted) || otherStages[0]
      setTargetFallbackId(defaultStage.id)
    }
  }, [open, otherStages])

  const handleDelete = async () => {
    if (!stage) return

    setDeleting(true)
    try {
      await deleteStage(stage.id, targetFallbackId || undefined)
      notifyTaskChanged()
      toast.success(`Stage "${stage.name}" deleted`)
      if (onDeleted) onDeleted()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete stage')
    } finally {
      setDeleting(false)
    }
  }

  if (!stage) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px] text-xs">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Delete Stage &ldquo;{stage.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
            <span>
              Are you sure you want to delete this stage? This action cannot be undone.
            </span>
            {affectedTasksCount > 0 && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 mt-2">
                <span className="font-semibold">{affectedTasksCount}</span>{' '}
                {affectedTasksCount === 1 ? 'task is' : 'tasks are'} currently in this stage.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {affectedTasksCount > 0 && otherStages.length > 0 && (
          <div className="space-y-1.5 py-1">
            <Label className="text-xs font-medium text-foreground">
              Move existing tasks to:
            </Label>
            <Select value={targetFallbackId} onValueChange={setTargetFallbackId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select target stage" />
              </SelectTrigger>
              <SelectContent>
                {otherStages.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span>{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel disabled={deleting} className="h-8 text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={deleting}
            className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting...' : 'Delete Stage'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
