import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import Order from "@/models/Order"

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

    // Get orders statistics
    const orders = await Order.find({ userId }).sort({ createdAt: -1 })
    const totalOrders = orders.length
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0)

    // Get recent orders (last 3)
    const recentOrders = orders.slice(0, 3).map((order) => ({
      id: order._id,
      orderId: order.orderId || `ORD-${order._id.toString().slice(-6)}`,
      date: order.createdAt.toISOString().split("T")[0],
      status: order.status || "Processing",
      total: `₦${order.total?.toFixed(2) || "0.00"}`,
      items: order.items?.length || 0,
    }))

    // Calculate monthly growth (compare with previous month)
    const currentMonth = new Date()
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const currentMonthOrders = orders.filter(
      (order) => new Date(order.createdAt) >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
    )
    const lastMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= lastMonth && orderDate < new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    })

    const orderGrowth =
      lastMonthOrders.length > 0
        ? (((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100).toFixed(1)
        : "0"

    const lastMonthSpent = lastMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const currentMonthSpent = currentMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0)
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
