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
  ShoppingBag,
  Store,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

interface SubOrder {
  _id: string
  storeId: string
  storeName?: string
  status: string
  totalPrice: number
  items: Array<{
    productName: string
    productId: string
    quantity: number
    priceAtPurchase: number
  }>
  createdAt: string
  updatedAt: string
}

interface MainOrder {
  _id: string
  userId: string
  orderNumber: string
  totalAmount: number
  grandTotal: number
  deliveryFee: number
  paymentMethod: string
  receiptUrl?: string
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    address: string
    state: string
    phone: string
    area: string
  }
  subOrders: SubOrder[]
  createdAt: string
  updatedAt: string
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
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    icon: XCircle,
  },
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<MainOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/orders/buyer", {
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("[v0] Fetched orders data:", data)

      setOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast.error("Failed to load orders", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((mainOrder) => {
    const matchesSearch =
      mainOrder.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mainOrder.subOrders.some(
        (subOrder) =>
          subOrder.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subOrder.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase())),
      )

    const matchesStatus =
      statusFilter === "all" || mainOrder.subOrders.some((subOrder) => subOrder.status.toLowerCase() === statusFilter)

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

  const formatCurrency = (amount: string | number) => {
    const numAmount =
      typeof amount === "number" ? amount : Number.parseFloat(amount.toString().replace(/[^\\d.-]/g, ""))
    return `₦${numAmount.toLocaleString()}`
  }

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase() as keyof typeof statusConfig
    const config = statusConfig[normalizedStatus] || statusConfig.pending
    const StatusIcon = config.icon

    return (
      <Badge className={config.color}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">

          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex space-x-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  My Orders
                </h1>
                <p className="text-sm sm:text-lg text-muted-foreground mt-1">Track your order history and status</p>
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
                      placeholder="Search orders by number, store, or product..."
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
                      <SelectItem value="failed">Failed</SelectItem>
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
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't placed any orders yet."}
                </p>
                <Link href="/stores">
                  <Button variant="default" size="sm">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((mainOrder) => (
                <Card key={mainOrder._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-xl">{mainOrder.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(mainOrder.createdAt)} • {mainOrder.subOrders.length} store
                            {mainOrder.subOrders.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="font-bold text-xl">{formatCurrency(mainOrder.grandTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          (incl. {formatCurrency(mainOrder.deliveryFee)} delivery)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {mainOrder.subOrders.map((subOrder, index) => (
                        <div key={subOrder._id} className="border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{subOrder.storeName || "Unknown Store"}</span>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(subOrder.status)}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-muted-foreground text-sm">Items</p>
                            <div className="space-y-2">
                              {subOrder.items.map((item, itemIndex) => (
                                <div key={`${subOrder._id}-${itemIndex}`} className="flex justify-between items-center">
                                  <span className="text-sm">
                                    {item.quantity}x {item.productName}
                                  </span>
                                  <span className="font-medium text-sm">
                                    {formatCurrency(item.priceAtPurchase * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="font-medium">Subtotal</span>
                              <span className="font-bold">{formatCurrency(subOrder.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}