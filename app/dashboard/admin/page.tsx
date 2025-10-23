"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  Users,
  ShoppingBag,
  Store,
  Loader2,
  Package,
  TrendingUp,
  ArrowUpRight,
  Eye,
  Settings,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface DashboardData {
  totalStores: number
  totalVisits: number
  totalSales: number
  totalRevenue: number
  storesChange: number
  visitsChange: number
  salesChange: number
  revenueChange: number
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/dashboard/admin")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast.error("Failed to load dashboard data", {
        description: "Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const adminItems = [
    {
      title: "All Orders",
      description: "Manage and track all platform orders",
      icon: Package,
      href: "/admin/orders",
      buttonText: "Manage Orders",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
    },
    {
      title: "All Stores",
      description: "View and manage all registered stores",
      icon: Store,
      href: "/admin/stores",
      buttonText: "Manage Stores",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Platform Users",
      description: "Manage all users and permissions",
      icon: Users,
      href: "/admin/users",
      buttonText: "Manage Users",
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50 dark:bg-violet-950/50",
      borderColor: "border-violet-200 dark:border-violet-800",
    },
    {
      title: "System Settings",
      description: "Configure platform settings and policies",
      icon: Settings,
      href: "/admin/settings",
      buttonText: "View Settings",
      iconColor: "text-slate-600",
      iconBg: "bg-slate-50 dark:bg-slate-950/50",
      borderColor: "border-slate-200 dark:border-slate-800",
    },
  ]

  if (loading) {
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="p-3 bg-muted rounded-xl animate-pulse">
                        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
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
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
              <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Admin Dashboard
                </h1>
                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400">
                  Comprehensive platform management and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Eye className="h-3 w-3 mr-1" />
                Platform Overview
              </Badge>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Platform Overview
            </h2>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Last 30 days
            </Badge>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-1 border transition-all duration-300 group">
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Stores</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {data?.totalStores?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Store className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="border-1 border transition-all duration-300 group">
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Sales</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {data?.totalSales?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <ShoppingBag className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-1 border transition-all duration-300 group">
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Visits</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {data?.totalVisits?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-6 w-6 text-violet-600" />
                      </div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-1 border transition-all duration-300 group">
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ₦{data?.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="border-1 border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin Actions</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Manage your platform efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {adminItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <Link href={item.href}>
                      <Card
                        className={`border ${item.borderColor} hover:shadow-md transition-all duration-300 group cursor-pointer`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 ${item.iconBg} rounded-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
