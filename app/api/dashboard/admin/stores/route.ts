import { NextResponse, type NextRequest } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { getUserFromCookies } from "@/lib/auth"
import type { ApiResponse } from "@/app/types/api"
import { slugify } from "@/lib/utils"

// -------------------- GET: Fetch All Stores --------------------
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB()

    const stores = await Store.find({ isPublished: true }).sort({ createdAt: -1 })

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

// -------------------- POST: Create New Store --------------------
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB()

    // 1. Authenticate user
    const user = await getUserFromCookies()
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug, description, logo_url, banner_url } = body

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json({ success: false, message: "Name and slug are required" }, { status: 400 })
    }

    // Re-slugify on the server
    const serverSlug = slugify(slug)

    // Check if slug already exists
    const existingStore = await Store.findOne({ slug: serverSlug })
    if (existingStore) {
      return NextResponse.json({ success: false, message: "Store URL (slug) already taken" }, { status: 409 })
    }

    // Create store
    const newStore = new Store({
      name,
      slug: serverSlug,
      description,
      logo_url,
      banner_url,
      owner: user.id,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await newStore.save()

    return NextResponse.json(
      { success: true, message: "Store created successfully", data: newStore },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating store:", error)
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json({ success: false, message: "Store URL (slug) already taken" }, { status: 409 })
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create store", error: error.message },
      { status: 500 }
    )
  }
}
