import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import Product from "@/models/Product"
import mongoose from "mongoose"

export async function GET(req: Request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "5")

    // ✅ Step 1: Aggregate sales by product
    const salesStats = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ])

    if (salesStats.length === 0) {
      return NextResponse.json({ success: true, products: [] })
    }

    // ✅ Step 2: Get product details
    const productIds = salesStats.map(
      (stat) => new mongoose.Types.ObjectId(stat._id)
    )
    const products = await Product.find({ _id: { $in: productIds } }).lean()

    // ✅ Step 3: Merge product data with stats
    const productsWithSales = salesStats
      .map((stat) => {
        const product = products.find(
          (p) => p._id.toString() === stat._id.toString()
        )
        if (!product) return null
        return {
          ...product,
          totalSold: stat.totalSold,
          totalRevenue: stat.totalRevenue,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      products: productsWithSales,
    })
  } catch (error: any) {
    console.error("Error fetching top-selling products:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch top-selling products",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
