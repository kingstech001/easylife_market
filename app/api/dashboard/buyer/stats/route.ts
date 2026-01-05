import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import MainOrder from "@/models/MainOrder"
import Order from "@/models/Order"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    await connectToDB()

    // Get user data
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get main orders with populated sub-orders
    const mainOrders = await MainOrder.find({ userId })
      .populate('subOrders')
      .sort({ createdAt: -1 })
      .lean()

    const totalOrders = mainOrders.length
    const totalSpent = mainOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)

    // Get recent orders (last 3)
    const recentOrders = mainOrders.slice(0, 3).map((order: any) => {
      const orderId = order._id instanceof mongoose.Types.ObjectId 
        ? order._id.toString() 
        : String(order._id)
      
      // Calculate total items from all sub-orders
      const totalItems = Array.isArray(order.subOrders) 
        ? order.subOrders.reduce((sum: number, subOrder: any) => {
            return sum + (Array.isArray(subOrder.items) ? subOrder.items.length : 0)
          }, 0)
        : 0
      
      return {
        id: orderId,
        orderId: order.orderNumber || `ORD-${orderId.slice(-6).toUpperCase()}`,
        date: new Date(order.createdAt).toISOString().split("T")[0],
        status: order.status || "pending",
        total: `₦${order.grandTotal?.toFixed(2) || "0.00"}`,
        items: totalItems,
        paymentStatus: order.paymentStatus || "pending",
      }
    })

    // Calculate monthly growth (compare with previous month)
    const currentMonth = new Date()
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const currentMonthOrders = mainOrders.filter(
      (order: any) => new Date(order.createdAt) >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    )
    const lastMonthOrders = mainOrders.filter((order: any) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= lastMonth && orderDate < new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    })

    const orderGrowth =
      lastMonthOrders.length > 0
        ? (((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1)
        : "0"

    const lastMonthSpent = lastMonthOrders.reduce((sum: number, order: any) => sum + (order.grandTotal || 0), 0)
    const currentMonthSpent = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.grandTotal || 0), 0)
    const spentGrowthPercent =
      lastMonthSpent > 0 ? (((currentMonthSpent - lastMonthSpent) / lastMonthSpent) * 100).toFixed(1) : "0"

    return NextResponse.json({
      stats: {
        totalOrders,
        totalSpent: `₦${totalSpent.toFixed(2)}`,
        orderGrowth: `${Number(orderGrowth) > 0 ? "+" : ""}${orderGrowth}% from last month`,
        spentGrowth: `${Number(spentGrowthPercent) > 0 ? "+" : ""}${spentGrowthPercent}% from last month`,
      },
      recentOrders,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}