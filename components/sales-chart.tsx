"use client"

import { useState, useEffect, useCallback } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type SalesData = {
  date: string
  totalSales: number
  ordersCount: number
}

export function SalesChart() {
  const [data, setData] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/seller/analytics/sales")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch sales data")
      }
      const result = await response.json()
      setData(result.data)
    } catch (err: any) {
      console.error("Error fetching sales data:", err)
      setError(err.message || "An unexpected error occurred.")
      toast.error("Failed to load sales data", {
        description: err.message || "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading sales data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] text-destructive">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        <p>No sales data available.</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        totalSales: {
          label: "Total Sales",
          color: "hsl(var(--chart-2))",
        },
        ordersCount: {
          label: "Orders",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            className="text-xs"
          />
          <YAxis tickLine={false} axisLine={false} className="text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="totalSales" stroke="var(--color-totalSales)" dot={false} />
          <Line type="monotone" dataKey="ordersCount" stroke="var(--color-ordersCount)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
