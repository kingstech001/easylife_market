import { Card, CardContent } from "@/components/ui/card"

export default function SellerProductsLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="h-10 bg-muted rounded w-36" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4 pb-4 border-b">
            {["w-48", "w-20", "w-24", "w-20", "w-24"].map((w, i) => (
              <div key={i} className={`h-4 bg-muted rounded ${w}`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
              <div className="h-10 w-10 bg-muted rounded" />
              <div className="flex-1 h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
