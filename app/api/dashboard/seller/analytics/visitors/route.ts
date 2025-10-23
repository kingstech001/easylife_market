import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectToDB } from "@/lib/db"
import Visit from "@/models/Visit"
import Store from "@/models/Store"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

// Helper: Verify JWT
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret)
  return payload
}

export async function GET(req: Request) {
  try {
    await connectToDB()

    // ✅ Step 1: Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // ✅ Step 2: Verify JWT token and extract user ID
    const payload = await verifyToken(token)
    const sellerId = payload?.id

    if (!sellerId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    // ✅ Step 3: Get params
    const { searchParams } = new URL(req.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    // ✅ Step 4: Find seller's store
    const store = await Store.findOne({ sellerId })
    if (!store) {
      return NextResponse.json(
        { success: false, message: "No store found for this seller" },
        { status: 404 }
      )
    }

    const storeId = store._id
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // ✅ Step 5: Fetch analytics
    const totalVisits = await Visit.countDocuments({
      storeId,
      visitedAt: { $gte: startDate },
    })

    const uniqueUsers = await Visit.distinct("userId", {
      storeId,
      userId: { $ne: null },
      visitedAt: { $gte: startDate },
    })

    const uniqueAnonymous = await Visit.distinct("ip", {
      storeId,
      userId: null,
      visitedAt: { $gte: startDate },
    })

    const dailyVisits = await Visit.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(storeId),
          visitedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    return NextResponse.json({
      success: true,
      analytics: {
        totalVisits,
        uniqueUsers: uniqueUsers.length,
        uniqueAnonymous: uniqueAnonymous.length,
        totalUniqueVisitors: uniqueUsers.length + uniqueAnonymous.length,
        dailyBreakdown: dailyVisits,
        period: `${days} days`,
      },
    })
  } catch (error: any) {
    console.error("Error fetching visit analytics:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics", error: error.message },
      { status: 500 },
    )
  }
}
