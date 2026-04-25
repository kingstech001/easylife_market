import { Card, CardContent } from "@/components/ui/card"

export default function BuyerOrdersLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 animate-pulse">
        <div className="flex items-start gap-4 mb-8">
          <div className="h-14 w-14 bg-muted rounded-2xl" />
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-40" />
            <div className="h-4 bg-muted rounded w-56" />
          </div>
        </div>

        {/* Search and filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-10 bg-muted rounded" />
              <div className="w-full sm:w-48 h-10 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Order cards */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-32" />
                    <div className="h-4 bg-muted rounded w-48" />
                  </div>
                  <div className="h-7 bg-muted rounded w-24" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-12 bg-muted rounded" />
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
