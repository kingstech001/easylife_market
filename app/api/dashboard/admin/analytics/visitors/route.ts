import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectToDB } from "@/lib/db"
import Visit from "@/models/Visit"
import { jwtVerify } from "jose"

// ✅ Verify JWT
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret)
  return payload
}

export async function GET(req: Request) {
  try {
    await connectToDB()

    // ✅ Step 1: Check Auth
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // ✅ Step 2: Verify Token
    const payload = await verifyToken(token)
    const userRole = payload?.role

    if (userRole !== "admin") {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // ✅ Step 3: Get query params (default: last 30 days)
    const { searchParams } = new URL(req.url)
    const days = Number.parseInt(searchParams.get("days") || "30")
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // ✅ Step 4: Fetch Analytics for All Stores
    // 🔴 FIXED: Changed visitedAt to createdAt
    const totalVisits = await Visit.countDocuments({
      createdAt: { $gte: startDate },
    })

    const uniqueUsers = await Visit.distinct("userId", {
      userId: { $ne: null },
      createdAt: { $gte: startDate },
    })

    const uniqueAnonymous = await Visit.distinct("ip", {
      userId: null,
      createdAt: { $gte: startDate },
    })

    // 🔴 FIXED: Changed visitedAt to createdAt in aggregation
    const dailyVisits = await Visit.aggregate([
      {
        $match: { createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    console.log("📊 Daily Visits Result:", dailyVisits) // Debug log

    // ✅ Step 5: Respond with Analytics
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
    console.error("Error fetching admin visit analytics:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin analytics", error: error.message },
      { status: 500 },
    )
  }
}