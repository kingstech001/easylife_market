// components/NewProductsLoading.tsx

// Mirrors NewProductsClient (same container, header row, grid and card shape)
// so nothing shifts when the real products stream in.
export function NewProductsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading new arrivals"
      className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}