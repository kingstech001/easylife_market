"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  ArrowLeft,
  Download,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

// Define types for orders
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

type OrderItem = {
  productId: string // Updated to match API response format
  productName: string
  quantity: number
  price: number
  image?: string
}

type Order = {
  _id: string // Updated to match MongoDB _id format
  id?: string
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  items: OrderItem[]
  status: OrderStatus
  total: number
  totalPrice?: number // Added totalPrice field from database
  createdAt: string
  shippingAddress?: string
  shippingInfo?: any // Added shippingInfo object from database
  userId?: string
  storeId?: string
  paymentMethod?: string // Added paymentMethod from database
  receiptUrl?: string // Added receiptUrl from database
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    icon: CheckCircle,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    icon: XCircle,
  },
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/orders/seller")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const transformedOrders = data.orders.map((order: any) => ({
        ...order,
        id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.slice(-6)}`,
        customerName: order.customerName || `Customer ${order.userId?.slice(-6) || "Unknown"}`,
        customerEmail: order.customerEmail || "No email provided",
        shippingAddress: order.shippingInfo
          ? `${order.shippingInfo.firstName || ""} ${order.shippingInfo.lastName || ""}, ${order.shippingInfo.address || ""}, ${order.shippingInfo.area || ""}, ${order.shippingInfo.state || ""}`
              .trim()
              .replace(/^,\s*|,\s*$/g, "") || "No address provided"
          : "No address provided",
        total: order.total || order.totalPrice || 0,
      }))

      setOrders(transformedOrders)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast.error("Failed to load orders", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      toast.success("Order status updated successfully")
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast.error("Failed to update order status")
    } finally {
      setIsUpdating(null)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Orders Management
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground mt-1">Track and manage all your customer orders</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders by number, customer name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't received any orders yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                return (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Badge className={statusConfig[order.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[order.status].label}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Items</p>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <p key={item.productId || index} className="font-medium">
                                {item.quantity}x {item.productName}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-muted-foreground mb-1">Order Date</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>

                        <div>
                          <p className="text-muted-foreground mb-1">item Price</p>
                           {order.items.map((item, index) => (
                              <p key={item.productId || index} className="font-medium">
                                {formatCurrency(item.price)}
                              </p>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
