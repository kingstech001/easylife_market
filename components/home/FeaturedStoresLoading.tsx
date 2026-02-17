// components/home/FeaturedStoresLoading.tsx

export function FeaturedStoresLoading() {
  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-12">
          {/* Simple spinner */}
          <div className="mx-auto w-16 h-16 border-4 border-muted border-t-[#e1a200] rounded-full animate-spin" />
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Loading Featured Stores
            </h3>
            <p className="text-sm text-muted-foreground">
              Discovering our top stores...
            </p>
          </div>
        </div>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 m-auto">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse"
            >
              <div className="w-full h-32 bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}