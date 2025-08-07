"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Heart, CreditCard, Star, TrendingUp, ShoppingBag, ShoppingCart, Plus } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { MobileSidebarTrigger } from "@/components/mobile-sidebar-trigger"
import Image from "next/image"
import { useCallback, useMemo, useEffect, useState } from "react"
import { toast } from "sonner"

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

interface RecommendedProduct {
  id: string
  name: string
  price: string
  image: string
  rating: number
  seller: string
  category: string
}

export default function BuyerDashboardPage() {
  const { items: cartItems, getTotalItems, getTotalPrice, removeFromCart, addToCart } = useCart()
  const { getTotalItems: getWishlistTotal } = useWishlist()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const cartTotal = useMemo(() => getTotalItems(), [getTotalItems])
  const wishlistTotal = useMemo(() => getWishlistTotal(), [getWishlistTotal])
  const cartValue = useMemo(() => getTotalPrice(), [getTotalPrice])

  const handleRemoveFromCart = useCallback((id: string) => removeFromCart(id), [removeFromCart])

  const handleAddToCart = useCallback(
    (product: RecommendedProduct) => {
      addToCart({
        id: product.id,
        name: product.name,
        price: Number.parseFloat(product.price.replace("₦", "")),
        image: product.image,
        quantity: 1,
      })
      toast.success(`${product.name} added to cart`)
    },
    [addToCart],
  )

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Fetch the authenticated user
        const userResponse = await fetch("/api/auth/me")
        if (!userResponse.ok) {
          toast.error("Unauthorized. Please log in again.")
          return
        }

        const { user } = await userResponse.json()
        if (!user?._id) {
          toast.error("User not found.")
          return
        }

        const userId = user._id

        // Fetch stats and recent orders
        const statsResponse = await fetch(`/api/dashboard/buyer/stats?userId=${userId}`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.stats)
          setRecentOrders(statsData.recentOrders)
        }

        // Fetch recommendations
        const recommendationsResponse = await fetch(`/api/dashboard/buyer/recommendations?userId=${userId}`)
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json()
          setRecommendedProducts(recommendationsData.products)
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4 h-96 bg-muted rounded"></div>
            <div className="col-span-3 h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative">
      <MobileSidebarTrigger />

      {/* Header */}
      <div className="md:flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/cart">
              <ShoppingCart className="mr-2 h-4 w-4" /> Cart ({cartTotal})
            </Link>
          </Button>
          <Button asChild>
            <Link href="/stores">
              <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Cart Items",
            value: cartTotal,
            sub: `₦${cartValue.toFixed(2)} total value`,
            icon: ShoppingCart,
          },
          {
            title: "Total Orders",
            value: stats?.totalOrders || 0,
            sub: stats?.orderGrowth || "No data",
            icon: Package,
          },
          {
            title: "Wishlist Items",
            value: wishlistTotal,
            sub: "Items saved for later",
            icon: Heart,
          },
          {
            title: "Total Spent",
            value: stats?.totalSpent || "₦0.00",
            sub: stats?.spentGrowth || "No data",
            icon: TrendingUp,
          },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Cart & Quick Actions */}
      {/* (Keep your existing cart, quick actions, recent orders, and recommendations sections as in your code) */}
      {/* ... */}
    </div>
  )
}
