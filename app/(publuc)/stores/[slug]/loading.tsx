import { Card, CardContent } from "@/components/ui/card"

export default function StoreDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Banner */}
      <div className="relative h-[220px] w-full sm:h-[280px] lg:h-[360px] bg-muted" />

      {/* Store info */}
      <div className="relative mx-auto -mt-14 max-w-7xl px-4 pb-6 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
        <div className="rounded-[28px] border border-border/70 bg-background p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="flex gap-4 mb-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 bg-muted rounded-[22px]" />
            <div className="space-y-3 flex-1">
              <div className="h-8 bg-muted rounded w-56" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded-full w-20" />
                <div className="h-6 bg-muted rounded-full w-24" />
              </div>
            </div>
          </div>
          <div className="h-20 bg-muted rounded-[24px] mt-5" />
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pb-12 pt-2 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-48 mb-2" />
            <div className="h-5 bg-muted rounded w-72" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-5 bg-muted rounded w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
