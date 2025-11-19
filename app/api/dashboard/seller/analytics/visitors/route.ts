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

    console.log("🔍 Seller ID:", sellerId)

    // ✅ Step 3: Get params
    const { searchParams } = new URL(req.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    // ✅ Step 4: Find seller's store
    const store = await Store.findOne({ sellerId })
    if (!store) {
      console.log("❌ No store found for seller:", sellerId)
      return NextResponse.json(
        { success: false, message: "No store found for this seller" },
        { status: 404 }
      )
    }

    const storeId = store._id
    console.log("🏪 Store ID:", storeId)

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    console.log("📅 Start Date:", startDate)

    // 🔍 DEBUG: Check all visits for this store (without date filter)
    const allVisitsCount = await Visit.countDocuments({ storeId })
    console.log("📊 Total visits for this store (all time):", allVisitsCount)

    // 🔍 DEBUG: Get sample visit to check field names
    const sampleVisit = await Visit.findOne({ storeId }).lean()
    console.log("🔬 Sample visit document:", JSON.stringify(sampleVisit, null, 2))

    // 🔍 DEBUG: Check visits with date filter
    const visitsWithDateFilter = await Visit.countDocuments({
      storeId,
      createdAt: { $gte: startDate },
    })
    console.log("📊 Visits within date range:", visitsWithDateFilter)

    // ✅ Step 5: Fetch analytics
    const totalVisits = await Visit.countDocuments({
      storeId,
      createdAt: { $gte: startDate },
    })

    const uniqueUsers = await Visit.distinct("userId", {
      storeId,
      userId: { $ne: null },
      createdAt: { $gte: startDate },
    })

    const uniqueAnonymous = await Visit.distinct("ip", {
      storeId,
      userId: null,
      createdAt: { $gte: startDate },
    })

    console.log("👥 Unique Users:", uniqueUsers.length)
    console.log("👻 Unique Anonymous:", uniqueAnonymous.length)

    // 🔍 DEBUG: Check aggregation with detailed logging
    const dailyVisits = await Visit.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(storeId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    console.log("📈 Daily Visits Result:", JSON.stringify(dailyVisits, null, 2))
    console.log("📊 Daily Visits Count:", dailyVisits.length)

    // 🔍 DEBUG: Alternative aggregation without ObjectId conversion
    const dailyVisitsAlt = await Visit.aggregate([
      {
        $match: {
          storeId: storeId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    console.log("📈 Alternative Daily Visits Result:", JSON.stringify(dailyVisitsAlt, null, 2))

    return NextResponse.json({
      success: true,
      analytics: {
        totalVisits,
        uniqueUsers: uniqueUsers.length,
        uniqueAnonymous: uniqueAnonymous.length,
        totalUniqueVisitors: uniqueUsers.length + uniqueAnonymous.length,
        dailyBreakdown: dailyVisits.length > 0 ? dailyVisits : dailyVisitsAlt,
        period: `${days} days`,
      },
      debug: {
        storeId: storeId.toString(),
        sellerId: sellerId.toString(),
        startDate: startDate.toISOString(),
        allVisitsCount,
        visitsWithDateFilter,
        sampleVisit,
      },
    })
  } catch (error: any) {
    console.error("❌ Error fetching visit analytics:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { success: false, message: "Failed to fetch analytics", error: error.message },
      { status: 500 },
    )
  }
}