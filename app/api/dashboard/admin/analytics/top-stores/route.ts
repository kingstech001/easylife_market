import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Visit from "@/models/Visit"

export async function GET(req: Request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "5")

    // ✅ Step 1: Aggregate visits grouped by store
    const visitStats = await Visit.aggregate([
      {
        $group: {
          _id: "$storeId",
          totalVisits: { $sum: 1 },
        },
      },
      { $sort: { totalVisits: -1 } }, // Sort by most visits
      { $limit: limit },
    ])

    if (visitStats.length === 0) {
      return NextResponse.json({ success: true, stores: [] })
    }

    // ✅ Step 2: Get store details for these IDs
    const storeIds = visitStats.map((v) => v._id)
    const stores = await Store.find({ _id: { $in: storeIds } }).lean() as Array<{ _id: any }>

    // ✅ Step 3: Merge store data with visit counts
    const storesWithVisits = visitStats.map((stat) => {
      const store = stores.find((s) => s._id.toString() === stat._id.toString())
      if (!store) return null
      return {
        ...store,
        visits: stat.totalVisits,
      }
    }).filter(Boolean)

    return NextResponse.json({ success: true, stores: storesWithVisits })
  } catch (error: any) {
    console.error("Error fetching top stores:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch top stores", error: error.message },
      { status: 500 }
    )
  }
}
