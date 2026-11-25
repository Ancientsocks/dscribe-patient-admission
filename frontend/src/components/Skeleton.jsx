export function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />
}

export function TableSkeleton({ rows = 6, columns = 7 }) {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-3.5 animate-pulse rounded bg-slate-200"
              style={{
                width: columnIndex === 0 ? '22%' : `${Math.floor(60 / columns)}%`,
                animationDelay: `${(rowIndex + columnIndex) * 40}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="card p-6" aria-hidden="true">
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-11 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <SkeletonLine className="h-10 w-24" />
        <SkeletonLine className="h-10 w-32" />
      </div>
    </div>
  )
}
