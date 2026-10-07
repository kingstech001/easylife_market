// app/stores/[slug]/products/[productId]/loading.tsx
// Mirrors ProductPageClient: breadcrumb, square gallery + thumbnails, info column, related grid.

export default function ProductDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2">
          <div className="h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="hidden h-4 w-40 animate-pulse rounded bg-muted sm:block" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-16 animate-pulse rounded-lg bg-muted sm:h-[72px] sm:w-[72px]"
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            </div>

            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-9 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-6">
              <div className="h-12 w-32 animate-pulse rounded-xl bg-muted" />
              <div className="hidden h-12 flex-1 animate-pulse rounded-xl bg-muted md:block" />
              <div className="ml-auto h-12 w-12 animate-pulse rounded-xl bg-muted md:ml-0" />
              <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="space-y-2 border-t border-border pt-6">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="mt-16 sm:mt-20">
          <div className="mb-6 space-y-2">
            <div className="h-7 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square animate-pulse rounded-xl bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}