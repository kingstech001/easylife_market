import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import { requireApiRole } from "@/lib/apiAuth"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiRole(req, ["admin"])
    if (auth.response) return auth.response

    await connectToDB()

    // Aggregate customers with order stats
    const customers = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          ordersCount: { $size: "$orders" },
          totalSpent: { $sum: "$orders.totalPrice" },
          lastOrder: { $max: "$orders.createdAt" },
          status: 1,
        },
      },
      { $sort: { lastOrder: -1 } },
    ])

    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 })
  }
}
