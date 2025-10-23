import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Visit from "@/models/Visit"
import Order from "@/models/Order"

export async function GET() {
  try {
    await connectToDB()

    // Query totals
    const totalStores = await Store.countDocuments()
    const totalVisits = await Visit.countDocuments()

    // ✅ Count only delivered orders
    const totalSales = await Order.countDocuments({ status: "delivered" })

    // ✅ Revenue only from delivered orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ])
    const totalRevenue = revenueAgg[0]?.total || 0

    return NextResponse.json({
      totalStores,
      totalVisits,
      totalSales,
      totalRevenue,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
