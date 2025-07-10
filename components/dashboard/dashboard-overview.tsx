"use client"

import { Store, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockStores } from "@/lib/mock-data"

export function DashboardOverview() {
  // In a real app, we would fetch this data from the API
  const totalStores = mockStores.length
  const totalVisits = 1248
  const totalSales = 36
  const totalRevenue = 3249.99

  // Calculate changes (would be from real data in production)
  const storesChange = +1
  const visitsChange = +12.5
  const salesChange = +8.2
  const revenueChange = +14.3

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStores}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {storesChange > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">{storesChange}</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                <span className="text-rose-500">{Math.abs(storesChange)}</span>
              </>
            )}
            <span className="ml-1">since last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisits.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {visitsChange > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{visitsChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                <span className="text-rose-500">-{Math.abs(visitsChange)}%</span>
              </>
            )}
            <span className="ml-1">since last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSales}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {salesChange > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{salesChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                <span className="text-rose-500">-{Math.abs(salesChange)}%</span>
              </>
            )}
            <span className="ml-1">since last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {revenueChange > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{revenueChange}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                <span className="text-rose-500">-{Math.abs(revenueChange)}%</span>
              </>
            )}
            <span className="ml-1">since last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
