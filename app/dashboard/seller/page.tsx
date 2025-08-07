"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  BarChart3,
  CreditCard,
  Users,
  ShoppingBag,
  Settings,
  Store,
  HelpCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Define a type for the dashboard statistics
type DashboardStats = {
  totalSales: number
  ordersCount: number
  customersCount: number
  productsCount: number
}

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [storeName, setStoreName] = useState<string | null>(null)
  const [storeError, setStoreError] = useState<string | null>(null)

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    setIsLoadingStats(true)
    setStatsError(null)
    try {
      const response = await fetch("/api/dashboard/seller/stats")
      if (!response.ok) {
        let errorMessage = "Failed to fetch dashboard statistics."
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          const errorText = await response.text().catch(() => "")
          if (errorText) {
            errorMessage = `Server error: ${errorText.substring(0, 100)}...`
          }
        }
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setStats(data.data)
    } catch (err: any) {
      setStatsError(err.message || "An unexpected error occurred.")
      toast.error("Failed to load dashboard stats", {
        description: err.message || "Please try again later.",
      })
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Fetch store name
  const fetchStore = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/store")
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || "Failed to fetch store")
      }
      const data = await res.json()
      setStoreName(data.store.name)
    } catch (error: any) {
      console.error("Error fetching store:", error)
      setStoreError(error.message || "Unable to fetch store")
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
    fetchStore()
  }, [fetchDashboardStats, fetchStore])

  const dashboardItems = [
    {
      title: "Analytics",
      description: "Track sales, revenue, and performance metrics",
      icon: BarChart3,
      href: "/dashboard/seller/analytics",
      buttonText: "View Analytics",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Billing",
      description: "Manage invoices and payment methods",
      icon: CreditCard,
      href: "/dashboard/seller/billing",
      buttonText: "Billing Info",
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Customers",
      description: "View and manage your customer base",
      icon: Users,
      href: "/dashboard/seller/customers",
      buttonText: "View Customers",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Products",
      description: "Manage and add products to your store",
      icon: ShoppingBag,
      href: "/dashboard/seller/products",
      buttonText: "Manage Products",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Store Details",
      description: "Update your shop profile and information",
      icon: Store,
      href: "/dashboard/seller/store",
      buttonText: "Edit Store",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100 dark:bg-teal-900/20",
    },
    {
      title: "Settings",
      description: "Customize dashboard preferences and configurations",
      icon: Settings,
      href: "/dashboard/seller/settings",
      buttonText: "Go to Settings",
      iconColor: "text-gray-600 dark:text-gray-400",
      iconBg: "bg-gray-100 dark:bg-gray-800",
    },
    {
      title: "Support",
      description: "Need help? Contact our support team",
      icon: HelpCircle,
      href: "/dashboard/seller/support",
      buttonText: "Get Support",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100 dark:bg-rose-900/20",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="hidden h-12 w-12 rounded-xl bg-primary md:flex items-center justify-center">
              <Store className="h-6 w-6 text-primary-foreground " />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Welcome back, {storeName || "Your Store"}
              </h1>
              {storeError && <p className="text-red-500 text-sm">{storeError}</p>}
              <p className="text-lg text-muted-foreground mt-1">Manage your store and track your success</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Overview</h2>
          {isLoadingStats ? (
            <div className="grid gap-6 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-32"></div>
                    </div>
                    <div className="p-3 bg-muted rounded-xl">
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center h-32 text-destructive">
              <p>Error loading stats: {statsError}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold text-foreground">₦{stats?.totalSales.toFixed(2) || "0.00"}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orders</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.ordersCount || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.customersCount || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.productsCount || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                    <Store className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Dashboard Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {dashboardItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card hover:bg-accent/50"
              >
                <CardHeader className="relative pb-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-xl ${item.iconBg} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-foreground transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{item.description}</p>
                  <Link href={item.href}>
                    <Button size="sm" className="w-full transition-all duration-300 shadow-sm hover:shadow-md">
                      {item.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
