import { memo } from 'react'
import { cn } from '@/lib/utils'
import { CornerDownRight } from 'lucide-react'

export type DropIndicatorPosition = 'top' | 'bottom' | 'subtask' | 'none'

interface DropIndicatorProps {
  position: DropIndicatorPosition
  isInvalid?: boolean
  parentTitle?: string
}

export const DropIndicator = memo(function DropIndicator({
  position,
  isInvalid = false,
  parentTitle
}: DropIndicatorProps) {
  if (position === 'none') return null

  if (position === 'subtask') {
    return (
      <div
        className={cn(
          "absolute inset-0 z-20 pointer-events-none rounded-md border-2 border-dashed transition-all flex items-center justify-end pr-3",
          isInvalid
            ? "border-destructive/60 bg-destructive/10 text-destructive"
            : "border-primary/70 bg-primary/10 text-primary"
        )}
      >
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/90 text-[11px] font-medium shadow-sm border border-border/60">
          <CornerDownRight className="h-3 w-3" />
          <span>{isInvalid ? 'Cannot nest in child' : `Make subtask ${parentTitle ? `of "${parentTitle}"` : ''}`}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "absolute left-0 right-0 z-20 pointer-events-none flex items-center transition-all",
        position === 'top' ? "-top-1" : "-bottom-1"
      )}
    >
      <div
        className={cn(
          "w-2 h-2 rounded-full border-2 bg-background shrink-0 -ml-1",
          isInvalid ? "border-destructive" : "border-primary"
        )}
      />
      <div
        className={cn(
          "h-0.5 w-full rounded-full transition-all",
          isInvalid ? "bg-destructive" : "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        )}
      />
    </div>
  )
})
