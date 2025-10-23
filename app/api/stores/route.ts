import { NextResponse, type NextRequest } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import type { ApiResponse } from "@/app/types/api"

// -------------------- GET: Fetch All Stores --------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB()

    const stores = await Store.find({ isPublished: true, isApproved: true }).sort({ createdAt: -1 })

    return NextResponse.json(
      { success: true, message: "Stores fetched successfully", stores },
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
