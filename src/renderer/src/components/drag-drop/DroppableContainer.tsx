import { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface DroppableContainerProps {
  id: string
  data?: Record<string, unknown>
  children: ReactNode | ((isOver: boolean) => ReactNode)
  className?: string
  activeClassName?: string
  disabled?: boolean
}

export function DroppableContainer({
  id,
  data,
  children,
  className,
  activeClassName,
  disabled = false
}: DroppableContainerProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data,
    disabled
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-150 relative",
        className,
        isOver && (activeClassName || "bg-primary/10 border-primary/40 ring-1 ring-primary/30")
      )}
    >
      {typeof children === 'function' ? children(isOver) : children}
    </div>
  )
}
