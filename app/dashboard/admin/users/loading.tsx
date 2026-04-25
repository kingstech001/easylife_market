import { Card, CardContent } from "@/components/ui/card"

export default function AdminUsersLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-28" />
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Table header */}
          <div className="flex gap-4 mb-4 pb-4 border-b">
            {["w-36", "w-40", "w-16", "w-20", "w-20"].map((w, i) => (
              <div key={i} className={`h-4 bg-muted rounded ${w}`} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-44" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-8 bg-muted rounded w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
