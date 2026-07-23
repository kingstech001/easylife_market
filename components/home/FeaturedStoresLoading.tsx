// components/home/FeaturedStoresLoading.tsx

export function FeaturedStoresLoading() {
  return (
    <section className="relative w-full py-6 sm:py-8 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8">
        

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 m-auto">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded border border-border bg-card p-6 space-y-4 animate-pulse"
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
