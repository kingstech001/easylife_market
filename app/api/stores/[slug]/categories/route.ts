import { NextResponse } from "next/server"
import Store from "@/models/Store"
import { connectToDB } from "@/lib/db"

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params // 👈 await is required

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Slug is required" },
        { status: 400 }
      )
    }

    await connectToDB()
    const store = await Store.findOne({ slug })

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      )
    }

    // Assuming categories are a field on the store document
    return NextResponse.json(
      { success: true, categories: store.categories || [] },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
