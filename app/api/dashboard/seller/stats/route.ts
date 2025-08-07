import { type NextRequest, NextResponse } from "next/server"
import Product from "@/models/Product"
import Order from "@/models/Order" // Import the Order model
import Store from "@/models/Store"
import getUserFromCookies from "@/lib/getUserFromCookies"
import { connectToDB } from "@/lib/db"
import mongoose from "mongoose"

export async function GET(request: Request) {
  await connectToDB()
  console.log("DB connected for GET dashboard stats.")

  try {
    const user = await getUserFromCookies(request as NextRequest)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })
    if (!userStore) {
      return NextResponse.json({ success: false, message: "Forbidden: Store not found for this user" }, { status: 403 })
    }

    const storeId = userStore._id

    // Fetch total products
    const productsCount = await Product.countDocuments({ storeId })

    // Aggregate for total sales, orders count, and unique customers
    const salesAggregation = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), status: "completed" } }, // Only count completed orders for sales
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          ordersCount: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$userId" }, // Collect unique user IDs
        },
      },
    ])

    const stats = salesAggregation[0] || { totalSales: 0, ordersCount: 0, uniqueCustomers: [] }
    const totalSales = stats.totalSales
    const ordersCount = stats.ordersCount
    const customersCount = stats.uniqueCustomers.length

    console.log(`✅ GET Dashboard Stats: Data fetched for store ${storeId}.`)
    return NextResponse.json(
      {
        success: true,
        data: {
          totalSales,
          ordersCount,
          customersCount,
          productsCount,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch dashboard stats", error: error.message },
      { status: 500 },
    )
  }
}
