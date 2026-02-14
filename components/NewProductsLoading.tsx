// components/NewProductsLoading.tsx

export function NewProductsLoading() {
  return (
    <div className="flex-1 p-4 lg:p-6">
      {/* Header Skeleton */}
      <div className="mb-8 text-center lg:text-left space-y-3">
        <div className="h-10 bg-muted rounded-lg w-64 mx-auto lg:mx-0 animate-pulse" />
        <div className="h-4 bg-muted rounded w-48 mx-auto lg:mx-0 animate-pulse" />
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-pulse"
          >
            <div className="w-full h-40 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}