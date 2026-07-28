import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TableRowsSkeletonProps {
  rows?: number
  columns?: number
}

export function TableRowsSkeleton({ rows = 10, columns = 6 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} aria-hidden className="border-b border-slate-100 last:border-0 dark:border-slate-800">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <td key={columnIndex} className="px-4 py-4">
              {columnIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="w-full max-w-32 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ) : (
                <Skeleton className={cn("h-4", columnIndex % 2 === 0 ? "w-16" : "w-24")} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

interface CardCollectionSkeletonProps {
  count?: number
  className?: string
  cardClassName?: string
}

export function CardCollectionSkeleton({
  count = 4,
  className,
  cardClassName,
}: CardCollectionSkeletonProps) {
  return (
    <div className={cn("grid gap-3", className)} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900",
            cardClassName
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 max-w-40" />
                <Skeleton className="h-3 w-1/2 max-w-28" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageContentSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <Skeleton className="mb-5 size-10 rounded-lg" />
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
