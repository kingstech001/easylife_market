import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"

interface RouteParams {
  params: Promise<{ slug: string }>
}

interface StoreDocument {
  _id: any
  name?: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId?: any
  createdAt?: Date
  updatedAt?: Date
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    // ✅ Await params (Next.js 15 requirement)
    const { slug } = await params


    // Validate slug
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid store slug",
        },
        { status: 400 }
      )
    }

    await connectToDB()

    // Find store by slug
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    }).lean<StoreDocument>()

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "Store not found",
        },
        { status: 404 }
      )
    }

    // Transform store data
    const storeData = {
      id: store._id ? store._id.toString() : "",
      name: store.name || "Unnamed Store",
      slug: store.slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      banner_url: store.banner_url || "",
      owner_id: store.sellerId ? store.sellerId.toString() : "",
      created_at: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
      updated_at: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        store: storeData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Error fetching store:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch store",
      },
      { status: 500 }
    )
  }
}