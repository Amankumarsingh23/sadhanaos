import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg animate-warm-shimmer',
        className
      )}
    />
  )
}

/* Preset skeletons for common layouts */
export function SkeletonCard() {
  return (
    <div className="rounded-card bg-parchment border border-sandstone p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  )
}

export function SkeletonShlok() {
  return (
    <div className="rounded-card bg-parchment border border-sandstone p-6 space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-3 w-3/5 mt-2" />
      <div className="space-y-2 mt-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}
