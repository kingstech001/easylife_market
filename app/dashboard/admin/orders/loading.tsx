import { Card, CardContent } from "@/components/ui/card"

export default function AdminOrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl mx-auto animate-pulse">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 bg-muted rounded-2xl" />
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-56" />
              <div className="h-4 bg-muted rounded w-72" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 sm:mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-4">
                  <div className="h-4 bg-muted rounded w-12 mb-2" />
                  <div className="h-7 bg-muted rounded w-8" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 h-11 bg-muted rounded" />
              <div className="w-full sm:w-[200px] h-11 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted rounded w-32" />
                    <div className="h-4 bg-muted rounded w-48" />
                  </div>
                  <div className="h-7 bg-muted rounded w-24" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-3 bg-muted rounded w-16" />
                      <div className="h-5 bg-muted rounded w-24" />
                    </div>
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
