import { Card, CardContent } from "@/components/ui/card"

export default function AllProductsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden">
        <div className="h-[300px] sm:h-[380px] bg-muted" />
      </section>

      {/* Categories skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-border/70 bg-background p-4 sm:p-5 lg:p-6">
          <div className="space-y-2 mb-5">
            <div className="h-3 bg-muted rounded w-28" />
            <div className="h-6 bg-muted rounded w-52" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[118px] h-28 bg-muted rounded-3xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Products grid skeleton */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-6">
          <div className="h-3 bg-muted rounded w-28" />
          <div className="h-8 bg-muted rounded w-72" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-5 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
