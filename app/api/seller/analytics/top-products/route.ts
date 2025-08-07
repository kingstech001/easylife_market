import { type NextRequest, NextResponse } from "next/server"
import Order from "@/models/Order"
import Store from "@/models/Store"
import getUserFromCookies from "@/lib/getUserFromCookies"
import { connectToDB } from "@/lib/db"
import mongoose from "mongoose"

export async function GET(request: Request) {
  await connectToDB()
  console.log("DB connected for GET top products analytics.")

  try {
    const user = await getUserFromCookies(request as NextRequest)
    if (!user) {
      console.log("❌ GET Top Products Analytics: User not authenticated.")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    console.log(`Debug: Authenticated user ID: ${user.id}`)

    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) })
    if (!userStore) {
      console.log(`❌ GET Top Products Analytics: Store not found for seller ID ${user.id}.`)
      return NextResponse.json({ success: false, message: "Forbidden: Store not found for this user" }, { status: 403 })
    }
    console.log(
      `✅ GET Top Products Analytics: Store found for seller ID ${user.id}: ${userStore.name} (${userStore._id}).`,
    )

    const storeId = userStore._id

    // Aggregate top products by total quantity sold
    const topProductsAggregation = await Order.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(storeId),
          status: "completed", // Only count completed orders
        },
      },
      { $unwind: "$items" }, // Deconstruct the items array
      {
        $group: {
          _id: "$items.productId",
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] } },
        },
      },
      { $sort: { totalQuantitySold: -1 } }, // Sort by quantity sold descending
      { $limit: 10 }, // Get top 10 products
      {
        $lookup: {
          from: "products", // The collection name for Product model (usually lowercase and plural)
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" }, // Deconstruct the productDetails array
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.name",
          imageUrl: { $arrayElemAt: ["$productDetails.images.url", 0] }, // Get the first image URL
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
    ])

    console.log(`Debug: Top Products Aggregation Result for store ${storeId}:`, JSON.stringify(topProductsAggregation, null, 2));

    console.log(`✅ GET Top Products Analytics: Data fetched for store ${storeId}.`)
    return NextResponse.json({ success: true, data: topProductsAggregation }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching top products analytics:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch top products analytics", error: error.message },
      { status: 500 },
    )
  }
}
