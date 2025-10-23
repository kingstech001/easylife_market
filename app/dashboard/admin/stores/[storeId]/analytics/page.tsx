"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Package, DollarSign, Activity, TrendingUp, ShoppingCart, Eye } from "lucide-react"
import { motion } from "framer-motion"

interface Analytics {
  storeName: string
  totalProducts: number
  totalActive: number
  totalDeleted: number
  avgPrice: number
  totalSales: number
  totalOrders: number
}

export default function StoreAnalyticsPage() {
  const { storeId } = useParams()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/dashboard/admin/stores/${storeId}/analytics`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || "Failed to load analytics")
        setAnalytics(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) fetchAnalytics()
  }, [storeId])

  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="p-3 bg-muted rounded-xl animate-pulse">
                        <div className="h-6 w-6"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <BarChart3 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Error Loading Analytics</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    )

  if (!analytics)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No analytics data available.</p>
      </div>
    )

  const stats = [
    {
      title: "Total Products",
      value: analytics.totalProducts,
      icon: Package,
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Products",
      value: analytics.totalActive,
      icon: Activity,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Deleted Products",
      value: analytics.totalDeleted,
      icon: BarChart3,
      bgColor: "bg-red-50 dark:bg-red-950/50",
      iconColor: "text-red-600",
    },
    {
      title: "Average Price",
      value: `₦${analytics.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Total Sales",
      value: `₦${analytics.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
      iconColor: "text-violet-600",
    },
    {
      title: "Total Orders",
      value: analytics.totalOrders,
      icon: ShoppingCart,
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {analytics.storeName}
                </h1>
                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400">
                  Store analytics and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Eye className="h-3 w-3 mr-1" />
                Analytics Overview
              </Badge>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
              >
                <Card className="border-1 border transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                        </div>
                        <div
                          className={`p-3 ${stat.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                        >
                          <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
