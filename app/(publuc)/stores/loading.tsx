// app/stores/loading.tsx
// Same container widths, search bar and compact-card heights as the real page,
// so nothing jumps when content arrives.

export default function StoresLoading() {
  return (
    <div aria-busy="true" aria-label="Loading stores" className="min-h-[100dvh] bg-background">
      {/* Hero / search */}
      <div className="mx-auto max-w-5xl px-4 pb-4 pt-4 sm:px-6 lg:pb-16 lg:pt-20">
        <div className="hidden max-w-2xl space-y-4 lg:block">
          <div className="h-12 w-4/5 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-12 max-w-lg animate-pulse rounded-xl bg-muted lg:mt-8" />
      </div>

      {/* Advertise banner */}
      <div className="mx-auto mt-5 max-w-5xl px-4 sm:mt-6 sm:px-6">
        <div className="h-14 animate-pulse rounded-xl bg-muted" />
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5 space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <div className="h-24 animate-pulse bg-muted sm:h-28 lg:h-32" />
              <div className="px-3 pb-3 pt-7 sm:pt-8 lg:pt-9">
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}