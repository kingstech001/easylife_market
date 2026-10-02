// components/home/FeaturedStoresLoading.tsx

export function FeaturedStoresLoading() {
  return (
    <section className="relative w-full py-6 sm:py-8 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] flex-shrink-0 rounded-xl border border-border bg-card p-0 shadow-sm animate-pulse sm:min-w-0 sm:w-full"
            >
              <div className="h-28 w-full rounded-t-xl bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
