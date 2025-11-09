import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Product from "@/models/Product"
import type { ApiResponse } from "@/app/types/api"

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB()

    // Fetch all published and approved stores
    const stores = await Store.find({ isPublished: true, isApproved: true }).sort({ createdAt: -1 })

    // Count products for each store
    const storesWithProductCount = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({ storeId: store._id })
        return {
          ...store.toObject(),
          productCount,
        }
      })
    )

    return NextResponse.json(
      {
        success: true,
        message: "Stores fetched successfully",
        stores: storesWithProductCount,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error fetching stores:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stores",
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
