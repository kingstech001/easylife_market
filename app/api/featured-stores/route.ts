import { NextResponse } from "next/server"
import Store from "@/models/Store"
import { connectToDB } from "@/lib/db"

export async function GET() {
  try {
    await connectToDB()
    // Fetch all published stores, sorted by creation date (newest first)
    const stores = await Store.find({ isPublished: true }).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, stores }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch featured stores" },
      { status: 500 },
    )
  }
}
