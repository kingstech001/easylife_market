"use client"

import { useState, useEffect } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"
import { BarChart3, ShoppingBag } from "lucide-react"
import { useAuth } from "@/context/AuthContext" // ✅ import your auth context

interface SalesData {
  date: string
  sales: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
        <p className="text-sm font-medium text-card-foreground mb-1">
          {new Date(label || "").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-chart-1"></div>
          <span className="text-sm text-muted-foreground">Sales:</span>
          <span className="text-sm font-semibold text-foreground">
            ₦{payload[0].value.toLocaleString()}
          </span>
        </div>
      </div>
    )
  }
  return null
}

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
    </div>
    <div className="h-[280px] bg-muted/30 animate-pulse rounded-lg"></div>
  </div>
)

const ErrorState = ({ error }: { error: string }) => (
  <div className="flex flex-col items-center justify-center h-[320px] text-center space-y-3">
    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
      <BarChart3 className="w-6 h-6 text-destructive" />
    </div>
    <div className="space-y-1">
      <h3 className="font-medium text-foreground">Unable to load sales data</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
    </div>
  </div>
)

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[320px] text-center space-y-3">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
      <ShoppingBag className="w-6 h-6 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <h3 className="font-medium text-foreground">No sales data yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Sales analytics will appear here once orders start coming in.
      </p>
    </div>
  </div>
)

export function SalesChart() {
  const { user, loading: authLoading } = useAuth() // ✅ get user from context
  const [data, setData] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait until AuthContext finishes loading
    if (authLoading) return
    if (!user) {
      setError("You must be logged in to view analytics.")
      setIsLoading(false)
      return
    }

    const fetchSales = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // ✅ choose endpoint dynamically based on user.role
        const apiUrl =
          user.role === "admin"
            ? "/api/dashboard/admin/analytics/sales"
            : "/api/dashboard/seller/analytics/sales"

        const res = await fetch(apiUrl, {
          cache: "no-store",
          credentials: "include",
        })

        const json = await res.json()
        if (!res.ok) throw new Error(json.message || "Failed to fetch sales data")

        const formattedData = (json.data || []).map((item: any) => ({
          date: item.date,
          sales: item.sales,
        }))

        setData(formattedData)
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <Card className="p-6">
        <LoadingSkeleton />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <ErrorState error={error} />
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState />
      </Card>
    )
  }

  return (
    <Card className="pt-2 pr-6 space-y-6">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `₦${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "hsl(var(--chart-1))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
