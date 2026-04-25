import { Card, CardContent } from "@/components/ui/card"

export default function AdminStoresLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-0">
              <div className="h-32 bg-muted rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="space-y-1 flex-1">
                    <div className="h-5 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
