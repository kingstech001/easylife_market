"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Heart, TrendingUp, ShoppingBag, ShoppingCart, RefreshCw, User, Trash2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import Image from "next/image"
import { useMemo, useEffect, useState } from "react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface DashboardStats {
  totalOrders: number
  totalSpent: string
  orderGrowth: string
  spentGrowth: string
}

interface RecentOrder {
  id: string
  orderId: string
  date: string
  status: string
  total: string
  items: number
}

export default function BuyerDashboardPage() {
  const { items: cartItems, getTotalItems, getTotalPrice, removeFromCart, addToCart } = useCart()
  const { getTotalItems: getWishlistTotal } = useWishlist()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const cartTotal = useMemo(() => getTotalItems(), [getTotalItems])
  const wishlistTotal = useMemo(() => getWishlistTotal(), [getWishlistTotal])
  const cartValue = useMemo(() => getTotalPrice(), [getTotalPrice])
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        const userResponse = await fetch("/api/me")
        if (!userResponse.ok) {
          toast.error("Unauthorized. Please log in again.")
          return
        }
        const { user } = await userResponse.json()
        setUserName(user.firstName || "User")

        if (!user?._id) {
          toast.error("User not found.")
          return
        }

        const userId = user._id
        // const userName = user.firstName || "User"

        const statsResponse = await fetch(`/api/dashboard/buyer/stats?userId=${userId}`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.stats)
          setRecentOrders(statsData.recentOrders)
        } else {
          toast.error("Failed to load dashboard stats.")
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen min-w-0 max-w-full overflow-x-clip bg-background">
        <div className="mx-auto min-w-0 max-w-7xl px-0 py-4 sm:px-4 sm:py-8">
          <div className="animate-pulse space-y-5 sm:space-y-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 shrink-0 bg-muted rounded-xl"></div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-8 max-w-48 bg-muted rounded"></div>
                <div className="h-4 max-w-64 bg-muted rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-muted rounded-2xl sm:h-32"></div>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-96 bg-muted rounded-lg"></div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-0 max-w-full overflow-x-clip bg-gradient-to-b from-[#0E5A43]/[0.035] via-background to-background">
      <div className="mx-auto min-w-0 max-w-7xl px-0 py-4 sm:px-4 sm:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0E5A43] shadow-lg shadow-[#0E5A43]/15 sm:h-12 sm:w-12">
                <User className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0E5A43] sm:text-xs">Buyer overview</p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  Welcome back, {userName}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-base">Everything about your shopping, at a glance.</p>
              </div>
            </div>

            <div className="grid w-full grid-cols-[auto_1fr] gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
              <Button variant="outline" size="sm" className="h-10 rounded-xl px-3" onClick={() => window.location.reload()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="sr-only sm:not-sr-only">Refresh</span>
              </Button>
              <Button asChild className="h-10 rounded-xl bg-[#0E5A43] text-white hover:bg-[#083B2D]">
                <Link href="/stores">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4"
        >
          {[
            {
              title: "Cart Items",
              value: cartTotal,
              sub: `₦${cartValue.toFixed(2)} total value`,
              icon: ShoppingCart,
              color: "bg-orange-100 dark:bg-orange-900/20 text-orange-600",
            },
            {
              title: "Total Orders",
              value: stats?.totalOrders || 0,
              sub: stats?.orderGrowth || "No data",
              icon: Package,
              color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600",
            },
            {
              title: "Wishlist Items",
              value: wishlistTotal,
              sub: "Items saved for later",
              icon: Heart,
              color: "bg-pink-100 dark:bg-pink-900/20 text-pink-600",
            },
            {
              title: "Total Spent",
              value: stats?.totalSpent || "₦0.00",
              sub: stats?.spentGrowth || "No data",
              icon: TrendingUp,
              color: "bg-green-100 dark:bg-green-900/20 text-green-600",
            },
          ].map((stat, i) => (
            <Card key={i} className="min-w-0 overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 sm:p-5 sm:pb-2">
                <CardTitle className="text-[11px] font-semibold text-muted-foreground sm:text-sm">{stat.title}</CardTitle>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1 sm:p-5 sm:pt-1">
                <div className="truncate text-xl font-bold tracking-tight sm:text-2xl">{stat.value}</div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <motion.div className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <ShoppingCart className="h-5 w-5" />
                      Current Cart
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Manage your cart items</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{cartTotal} items</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Your cart is empty</p>
                    <Button asChild variant="outline">
                      <Link href="/stores">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border p-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:p-3"
                      >
                        <Image
                          src={item.image || "/placeholder.svg?height=48&width=48"}
                          alt={item.name}
                          width={52}
                          height={52}
                          className="h-12 w-12 shrink-0 rounded-xl border object-cover sm:h-[52px] sm:w-[52px]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ₦{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="h-9 shrink-0 px-2 text-red-500 hover:text-red-700 sm:px-3"
                        >
                          <Trash2 className="h-4 w-4 sm:hidden" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                    ))}

                    {cartItems.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">+{cartItems.length - 3} more items</p>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg text-primary">₦{cartValue.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href="/dashboard/buyer/cart">View Cart</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/checkout">Checkout <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your latest orders at a glance</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{recentOrders.length} orders</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No recent orders found</p>
                    <Button asChild variant="outline">
                      <Link href="/stores">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="break-all font-medium">{order.orderId}</div>
                          <div className="text-sm text-muted-foreground">{order.date}</div>
                        </div>
                        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                          <Badge
                            variant={order.status === "delivered" ? "default" : "secondary"}
                            className={
                              order.status === "delivered"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : ""
                            }
                          >
                            {order.status}
                          </Badge>
                          <span className="font-semibold">{order.total}</span>
                        </div>
                      </div>
                    ))}

                    {recentOrders.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{recentOrders.length - 3} more orders
                      </p>
                    )}

                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/dashboard/buyer/orders">View All Orders</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
