import { Card, CardContent } from "@/components/ui/card"

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-12 space-y-8">
        <div className="animate-pulse space-y-2">
          <div className="flex items-start justify-between">
            <div className="h-10 bg-muted rounded w-64" />
            <div className="h-8 bg-muted rounded w-28" />
          </div>
          <div className="h-5 bg-muted rounded w-80 mt-2" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-7 bg-muted rounded w-20" />
                  </div>
                  <div className="h-11 w-11 bg-muted rounded-xl" />
                </div>
                <div className="h-4 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-40 mb-2" />
                <div className="h-4 bg-muted rounded w-56 mb-6" />
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
