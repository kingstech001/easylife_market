import { NextResponse, type NextRequest } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Product from "@/models/Product" // ✅ Make sure you have this model
import type { ApiResponse } from "@/app/types/api"

// -------------------- GET: Fetch All Stores --------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB()

    // Fetch all approved & published stores
    const stores = await Store.find({ isPublished: true, isApproved: true })
      .sort({ createdAt: -1 })
      .lean()

    // ✅ Add product count for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({ storeId: store._id })
        return {
          ...store,
          productCount,
          address: store.address || "No address provided",
        }
      })
    )

    return NextResponse.json(
      { success: true, message: "Stores fetched successfully", stores: storesWithCounts },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error fetching stores:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch stores", error: error.message },
      { status: 500 }
    )
  }
}
