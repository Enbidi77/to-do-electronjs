import { memo } from 'react'
import type { Stage } from '@shared/types'
import { STAGE_ICONS } from '@/components/stage/stage-dialog'
import { Circle, GripVertical } from 'lucide-react'

interface StageDragPreviewProps {
  stage: Stage
}

export const StageDragPreview = memo(function StageDragPreview({ stage }: StageDragPreviewProps) {
  const IconComp = (stage.icon && STAGE_ICONS[stage.icon]) || Circle

  return (
    <div className="w-[300px] rounded-xl border-2 border-primary/70 bg-card/95 shadow-2xl backdrop-blur-md overflow-hidden rotate-2 pointer-events-none opacity-95 ring-2 ring-primary/20">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-muted/60">
        <div className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-primary shrink-0 -ml-1" />
          <IconComp className="h-3.5 w-3.5 shrink-0" style={{ color: stage.color }} />
          <span className="font-semibold text-xs text-foreground truncate">
            {stage.name}
          </span>
          {stage.isCompleted && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
              Done
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-full bg-background border border-border/50">
          Moving Stage
        </span>
      </div>
      <div className="h-16 flex items-center justify-center border-t border-dashed border-border/40 text-muted-foreground text-xs italic bg-muted/10">
        Drop to reorder stage
      </div>
    </div>
  )
})
