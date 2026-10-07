// components/home/FeaturedStoresLoading.tsx

// Mirrors the real carousel (same section padding, card widths and banner
// heights) so nothing jumps when the real content streams in.
export function FeaturedStoresLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading popular stores"
      className="relative w-full overflow-hidden bg-background py-6 sm:py-8 lg:py-12"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />

        <div className="flex gap-4 overflow-hidden md:gap-6 lg:gap-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="min-w-[300px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card sm:min-w-[420px] md:min-w-[500px] lg:min-w-[660px] xl:min-w-[920px]"
            >
              <div className="h-32 w-full animate-pulse bg-muted sm:h-36 md:h-40 lg:h-52 xl:h-64" />
              <div className="px-3 pb-4 pt-10 sm:pt-12 lg:px-4 xl:px-5 xl:pt-14">
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}