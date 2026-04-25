import { Card, CardContent } from "@/components/ui/card"

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-muted rounded-2xl" />

          {/* Details */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-28" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>

            <div className="h-10 bg-muted rounded w-32" />

            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>

            <div className="flex gap-3">
              <div className="h-12 bg-muted rounded-full flex-1" />
              <div className="h-12 w-12 bg-muted rounded-full" />
            </div>
          </div>
        </div>

        {/* Related products */}
        <div className="mt-12">
          <div className="h-7 bg-muted rounded w-40 mb-6" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
