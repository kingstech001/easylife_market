// File: /app/api/stores/top/route.ts
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"

export async function GET(req: Request) {
  try {
    await connectToDB()

    // Extract limit from query params (default to 5)
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    // Fetch top stores: published stores, sorted by visits descending
    const stores = await Store.find({ isPublished: true })
      .sort({ visits: -1 }) // if visits field exists
      .limit(limit)
      .select("_id name logo_url isPublished visits") // Only return needed fields

    return NextResponse.json({ stores }, { status: 200 })
  } catch (error) {
    console.error("Error fetching top stores:", error)
    return NextResponse.json(
      { message: "Failed to fetch top stores", error: String(error) },
      { status: 500 }
    )
  }
}
