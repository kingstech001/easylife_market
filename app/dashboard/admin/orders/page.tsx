"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  ChevronDown,
  Calendar,
  MapPin,
  Mail,
  User,
  Store,
  DollarSign,
  MoreVertical,
  Eye,
  Trash2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Clock,
    dotColor: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: CheckCircle,
    dotColor: "bg-blue-500",
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: Truck,
    dotColor: "bg-purple-500",
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle,
    dotColor: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: XCircle,
    dotColor: "bg-red-500",
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

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
      toast.error("Failed to load orders", {
        description: "Please try again later",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

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

      toast.success("Status updated", {
        description: `Order status changed to ${statusConfig[newStatus].label}`,
      })
      setEditingOrder(null)
      setEditingStatus(null)
    } catch (error) {
      console.error("Failed to update order status:", error)
      toast.error("Failed to update status", {
        description: "Please try again",
      })
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
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const getStatusCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-1 sm:mb-2">
                  Orders Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Monitor and manage all orders across the platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={isLoading}
                className="hover:bg-accent"
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-accent">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6 sm:mt-8"
          >
            {[
              { label: "All", value: statusCounts.all, color: "text-foreground" },
              { label: "Pending", value: statusCounts.pending, color: "text-amber-600" },
              { label: "Confirmed", value: statusCounts.confirmed, color: "text-blue-600" },
              { label: "Shipped", value: statusCounts.shipped, color: "text-purple-600" },
              { label: "Delivered", value: statusCounts.delivered, color: "text-emerald-600" },
              { label: "Cancelled", value: statusCounts.cancelled, color: "text-red-600" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="hover:shadow-md transition-all duration-300 hover:border-foreground/20">
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-border/50 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by order number, customer, email, or store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10 sm:h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                    <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                    <SelectItem value="confirmed">Confirmed ({statusCounts.confirmed})</SelectItem>
                    <SelectItem value="shipped">Shipped ({statusCounts.shipped})</SelectItem>
                    <SelectItem value="delivered">Delivered ({statusCounts.delivered})</SelectItem>
                    <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-muted rounded w-32"></div>
                        <div className="h-4 bg-muted rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-24"></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-12 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 sm:p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold">No orders found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria to find what you're looking for."
                        : "No orders have been placed yet. Orders will appear here once customers start purchasing."}
                    </p>
                  </div>
                  {(searchTerm || statusFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const StatusIcon = statusConfig[order.status].icon
                  const isEditing = editingOrder === order._id
                  const isExpanded = expandedOrder === order._id

                  return (
                    <motion.div
                      key={order._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-foreground/20 overflow-hidden">
                        <CardContent className="p-4 sm:p-6">
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-base sm:text-lg truncate">
                                    {order.orderNumber}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium shrink-0"
                                  >
                                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                  <Store className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{order.storeName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                              {isEditing ? (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <Select
                                    value={editingStatus || order.status}
                                    onValueChange={(value) => setEditingStatus(value as OrderStatus)}
                                  >
                                    <SelectTrigger className="w-full sm:w-[150px] h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-3 w-3" />
                                          Pending
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="confirmed">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-3 w-3" />
                                          Confirmed
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="shipped">
                                        <div className="flex items-center gap-2">
                                          <Truck className="h-3 w-3" />
                                          Shipped
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="delivered">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-3 w-3" />
                                          Delivered
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="cancelled">
                                        <div className="flex items-center gap-2">
                                          <XCircle className="h-3 w-3" />
                                          Cancelled
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    onClick={() => saveStatusChange(order._id)}
                                    disabled={isUpdating === order._id}
                                    className="h-9 w-9 p-0"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    className="h-9 w-9 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Badge
                                    variant="outline"
                                    className={`${statusConfig[order.status].color} border px-3 py-1`}
                                  >
                                    <div className={`h-1.5 w-1.5 rounded-full ${statusConfig[order.status].dotColor} mr-2 animate-pulse`} />
                                    <StatusIcon className="h-3 w-3 mr-1.5" />
                                    {statusConfig[order.status].label}
                                  </Badge>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        disabled={isUpdating === order._id}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem
                                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        {isExpanded ? "Hide Details" : "View Details"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => startEditing(order._id, order.status)}>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Status
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Order
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                                <User className="h-3.5 w-3.5" />
                                Customer
                              </div>
                              <p className="font-semibold text-sm sm:text-base truncate">{order.customerName}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{order.customerEmail}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                                <Package className="h-3.5 w-3.5" />
                                Items
                              </div>
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, index) => (
                                  <p key={item.productId || index} className="font-medium text-sm truncate">
                                    {item.quantity}× {item.productName}
                                  </p>
                                ))}
                                {order.items.length > 2 && (
                                  <button
                                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                    className="text-xs text-primary hover:underline font-medium"
                                  >
                                    +{order.items.length - 2} more items
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Order Date
                              </div>
                              <p className="font-semibold text-sm sm:text-base">{formatDate(order.createdAt)}</p>
                              <p className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium">
                                ₦
                                Total Amount
                              </div>
                              <p className="font-bold text-lg sm:text-xl text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(order.total)}
                              </p>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-6 pt-6 border-t border-border space-y-4">
                                  {/* All Items */}
                                  <div>
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      All Items ({order.items.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {order.items.map((item, index) => (
                                        <div
                                          key={item.productId || index}
                                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md bg-background border flex items-center justify-center">
                                              <Package className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm">{item.productName}</p>
                                              <p className="text-xs text-muted-foreground">
                                                Qty: {item.quantity}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="font-semibold text-sm">
                                            {formatCurrency(item.price * item.quantity)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Shipping Address */}
                                  {order.shippingAddress && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Shipping Address
                                      </h4>
                                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                        {order.shippingAddress}
                                      </p>
                                    </div>
                                  )}

                                  {/* Payment Method */}
                                  {order.paymentMethod && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Payment Method
                                      </h4>
                                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg capitalize">
                                        {order.paymentMethod}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Quick Toggle Button (Mobile) */}
                          {order.items.length > 2 && (
                            <button
                              onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border-t border-border/50"
                            >
                              <span>{isExpanded ? "Show Less" : "Show More"}</span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Pagination Info */}
        {!isLoading && filteredOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 sm:mt-8"
          >
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{orders.length}</span> orders
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="default" size="sm" className="w-8 h-8 p-0">
                        1
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        2
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        3
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}