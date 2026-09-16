import { Skeleton } from '@/components/ui/skeleton'

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
