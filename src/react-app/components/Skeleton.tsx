export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-800 rounded ${className}`}
    />
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-40 md:w-56">
      <Skeleton className="aspect-[2/3] rounded-xl w-full" />
      <Skeleton className="mt-2 h-4 w-3/4 rounded" />
      <Skeleton className="mt-1 h-3 w-1/2 rounded" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="px-4">
      <Skeleton className="h-7 w-48 mb-3 rounded" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
