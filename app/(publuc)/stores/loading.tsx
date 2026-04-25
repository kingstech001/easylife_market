import { Card, CardContent } from "@/components/ui/card"

export default function StoresLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="text-center mb-8">
          <div className="h-9 bg-muted rounded w-48 mx-auto mb-3" />
          <div className="h-5 bg-muted rounded w-72 mx-auto" />
        </div>

        <div className="flex justify-center mb-8">
          <div className="h-10 bg-muted rounded w-64" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-36 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-muted rounded-full" />
                    <div className="space-y-1 flex-1">
                      <div className="h-5 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-20" />
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
