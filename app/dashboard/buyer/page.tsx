"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Heart, TrendingUp, ShoppingBag, ShoppingCart, ArrowLeft, RefreshCw, User } from "lucide-react"
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
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-muted rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-64"></div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
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
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">

          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex space-x-4 mb-4 sm:mb-0">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Welcome back! {userName}
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground mt-1">Here's your shopping overview</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button asChild>
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
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
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
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Current Cart
                    </CardTitle>
                    <CardDescription>Manage your cart items</CardDescription>
                  </div>
                  <Badge variant="secondary">{cartTotal} items</Badge>
                </div>
              </CardHeader>
              <CardContent>
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
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Image
                          src={item.image || "/placeholder.svg?height=48&width=48"}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="rounded-md border"
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
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
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

                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href="/dashboard/buyer/cart">View Cart</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/checkout">Checkout</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>Your latest orders at a glance</CardDescription>
                  </div>
                  <Badge variant="secondary">{recentOrders.length} orders</Badge>
                </div>
              </CardHeader>
              <CardContent>
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
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{order.orderId}</div>
                          <div className="text-sm text-muted-foreground">{order.date}</div>
                        </div>
                        <div className="flex items-center gap-3">
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
