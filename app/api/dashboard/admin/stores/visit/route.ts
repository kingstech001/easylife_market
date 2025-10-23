import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Visit from "@/models/Visit"
import { getUserFromCookies } from "@/lib/auth" // adjust path to your helper

export async function POST(req: Request) {
  try {
    await connectToDB()

    const { storeId } = await req.json()
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "storeId is required" },
        { status: 400 }
      )
    }

    // ✅ Get authenticated user from cookies
    const user = await getUserFromCookies()

    // Get client IP for anonymous tracking
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown"

    const userAgent = req.headers.get("user-agent") || "unknown"

    // Check for recent visit to avoid duplicates (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const recentVisit = await Visit.findOne({
      storeId,
      ...(user ? { userId: user.id } : { ip }),
      visitedAt: { $gte: thirtyMinutesAgo },
    })

    if (recentVisit) {
      return NextResponse.json(
        {
          success: true,
          visit: recentVisit,
          message: "Recent visit found, not creating duplicate",
        },
        { status: 200 }
      )
    }

    // ✅ Use user.id from cookie auth instead of trusting request body
    const visit = await Visit.create({
      storeId,
      userId: user ? user.id : null,
      ip: user ? null : ip, // Only save IP if user is anonymous
      userAgent,
      visitedAt: new Date(),
    })

    return NextResponse.json({ success: true, visit }, { status: 201 })
  } catch (error: any) {
    console.error("Error logging store visit:", error)
    return NextResponse.json(
      { success: false, message: "Failed to log visit", error: error.message },
      { status: 500 }
    )
  }
}
