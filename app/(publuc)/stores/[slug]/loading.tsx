// app/stores/[slug]/loading.tsx
// Mirrors the real page: back link, banner with overlapping logo, info block, product grid.

export default function StoreDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading store" className="min-h-screen bg-background">
      <div className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />

          <div className="relative">
            <div className="aspect-[2/1] w-full animate-pulse rounded-2xl bg-muted sm:aspect-[2.4/1] lg:aspect-[3/1]" />
            <div className="absolute -bottom-8 left-4 h-16 w-16 animate-pulse rounded-2xl border-4 border-background bg-muted-foreground/20 sm:-bottom-10 sm:left-6 sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
          </div>

          <div className="space-y-3 pb-6 pt-11 sm:pt-14 lg:pt-16">
            <div className="h-8 w-56 animate-pulse rounded bg-muted" />
            <div className="flex gap-4">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}