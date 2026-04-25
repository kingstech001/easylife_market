import { Card, CardContent } from "@/components/ui/card"

export default function SellerDashboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex gap-4 items-center">
            <div className="h-16 w-16 bg-muted rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-64" />
              <div className="h-5 bg-muted rounded w-48" />
            </div>
          </div>
          <div className="h-8 bg-muted rounded w-24" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 bg-muted rounded w-28" />
            <div className="h-6 bg-muted rounded w-28" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20" />
                      <div className="h-6 bg-muted rounded w-16" />
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-xl" />
                  </div>
                  <div className="h-3 bg-muted rounded w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-32 mb-2" />
                <div className="h-4 bg-muted rounded w-48 mb-6" />
                <div className="h-56 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
