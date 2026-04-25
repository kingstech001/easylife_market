import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BuyerDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 animate-pulse">
        <div className="flex items-center space-x-4 mb-8">
          <div className="h-12 w-12 bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-64" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-8 w-8 bg-muted rounded-lg" />
              </CardHeader>
              <CardContent>
                <div className="h-7 bg-muted rounded w-16 mb-1" />
                <div className="h-3 bg-muted rounded w-28" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-32 mb-2" />
                <div className="h-4 bg-muted rounded w-40 mb-6" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-16 bg-muted rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
