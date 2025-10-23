"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Package,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Download,
  RefreshCw,
  Edit3,
  Save,
  X,
  Shield,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Define types for orders
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

type OrderItem = {
  productId: string
  productName: string
  quantity: number
  price: number
  image?: string
}

type Order = {
  _id: string
  id?: string
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  items: OrderItem[]
  status: OrderStatus
  total: number
  totalPrice?: number
  createdAt: string
  shippingAddress?: string
  shippingInfo?: any
  userId?: string
  storeId?: string
  storeName?: string
  paymentMethod?: string
  receiptUrl?: string
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/orders/admin")

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
        storeName: order.storeName || "Unknown Store",
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
      toast("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId)
    try {
      const response = await fetch(`/api/orders/admin/${orderId}`, {
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

      toast("Order status updated successfully")
      setEditingOrder(null)
      setEditingStatus(null)
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast("Failed to update order status")
    } finally {
      setIsUpdating(null)
    }
  }

  const startEditing = (orderId: string, currentStatus: OrderStatus) => {
    setEditingOrder(orderId)
    setEditingStatus(currentStatus)
  }

  const cancelEditing = () => {
    setEditingOrder(null)
    setEditingStatus(null)
  }

  const saveStatusChange = (orderId: string) => {
    if (editingStatus) {
      updateOrderStatus(orderId, editingStatus)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Admin Orders Management
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
                  Track and manage all platform orders with edit capabilities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoading}
                className="flex-1 sm:flex-none bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders by number, customer, email, or store..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
                  <CardContent className="p-4 sm:p-6">
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
              <CardContent className="p-8 sm:p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No orders have been placed yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                const isEditing = editingOrder === order._id
                return (
                  <Card key={order._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-lg truncate">{order.orderNumber}</h3>
                            <p className="text-sm text-muted-foreground truncate">Store: {order.storeName}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end sm:justify-start space-x-3 flex-shrink-0">
                          {isEditing ? (
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                              <Select
                                value={editingStatus || order.status}
                                onValueChange={(value) => setEditingStatus(value as OrderStatus)}
                              >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => saveStatusChange(order._id)}
                                disabled={isUpdating === order._id}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Badge className={statusConfig[order.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status].label}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(order._id, order.status)}
                                disabled={isUpdating === order._id}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Customer</p>
                          <p className="font-medium truncate">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.customerEmail}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Items</p>
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, index) => (
                              <p key={item.productId || index} className="font-medium truncate">
                                {item.quantity}x {item.productName}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{order.items.length - 2} more items</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Order Date</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium">Total Amount</p>
                          <p className="font-medium text-lg text-green-600 dark:text-green-400">
                            {formatCurrency(order.total)}
                          </p>
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
