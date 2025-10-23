import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import User from "@/models/User"
import getUserFromCookies from "@/lib/getUserFromCookies"

export async function GET(request: NextRequest) {
  await connectToDB()

  try {
    // 1️⃣ Get user ID from token
    const userFromToken = await getUserFromCookies(request)
    if (!userFromToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // 2️⃣ Fetch user directly from database to confirm role
    const user = await User.findById(userFromToken.id)
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden: Admins only" }, { status: 403 })
    }

    // 3️⃣ Calculate last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // 4️⃣ Aggregate sales across all stores
    const salesAggregation = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+01:00" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // 5️⃣ Fill missing days with 0 sales
    const salesData: { date: string; sales: number }[] = []
    const currentDate = new Date(thirtyDaysAgo)

    while (currentDate <= today) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`; // "YYYY-MM-DD"

      const existingData = salesAggregation.find((item) => item._id === dateString)
      salesData.push({
        date: dateString,
        sales: existingData ? existingData.totalSales : 0,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({ success: true, data: salesData }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch admin sales analytics" },
      { status: 500 },
    )
  }
}
