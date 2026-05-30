import { cn } from '@/lib/utils'

/* ─── Base shimmer ───────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-gray-100', className)} />
  )
}

/* ─── Table skeleton ─────────────────────────────────────── */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-32' : 'flex-1'}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className={`h-3 ${c === 0 ? 'w-28' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Card skeleton ──────────────────────────────────────── */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('bg-white border border-gray-100 rounded-2xl p-5 space-y-3', className)}>
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  )
}

/* ─── KPI card skeleton ──────────────────────────────────── */
export function SkeletonKPI() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  )
}

/* ─── Page header skeleton ───────────────────────────────── */
export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <Skeleton className="h-9 w-28 rounded-xl" />
    </div>
  )
}
