import { NextResponse, type NextRequest } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Product from "@/models/Product"

interface StoreDocument {
  _id: any
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: any
  isPublished: boolean
  isApproved?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface StoreResponse {
  _id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: string
  isPublished: boolean
  isApproved?: boolean
  createdAt: string
  updatedAt: string
  productCount?: number
}

interface ApiResponse {
  success: boolean
  message?: string
  stores?: StoreResponse[]
  count?: number
  error?: string
}

// ✅ GET: Fetch All Published Stores
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log("🔍 Fetching all stores...")

    await connectToDB()

    // Fetch all published stores (with or without approval based on your schema)
    const query: any = { isPublished: true }
    
    // Only add isApproved if your Store model has this field
    // Comment this out if your model doesn't have isApproved
    // query.isApproved = true

    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .lean<StoreDocument[]>()
      .exec()

    console.log(`✅ Found ${stores.length} stores`)

    // ✅ Add product count for each store (optional, can be removed for faster response)
    const storesWithCounts: StoreResponse[] = await Promise.all(
      stores.map(async (store): Promise<StoreResponse> => {
        try {
          const productCount = await Product.countDocuments({ 
            storeId: store._id,
            // Add these filters if your Product model has them
            // isActive: true,
            // isDeleted: false,
          })
          
          return {
            _id: store._id ? store._id.toString() : "",
            name: store.name || "",
            slug: store.slug || "",
            description: store.description || "",
            logo_url: store.logo_url || "",
            banner_url: store.banner_url || "",
            sellerId: store.sellerId ? store.sellerId.toString() : "",
            isPublished: store.isPublished ?? false,
            isApproved: store.isApproved ?? true,
            createdAt: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
            productCount,
          }
        } catch (err) {
          console.error(`Error processing store ${store._id}:`, err)
          // Return store without product count if there's an error
          return {
            _id: store._id ? store._id.toString() : "",
            name: store.name || "",
            slug: store.slug || "",
            description: store.description || "",
            logo_url: store.logo_url || "",
            banner_url: store.banner_url || "",
            sellerId: store.sellerId ? store.sellerId.toString() : "",
            isPublished: store.isPublished ?? false,
            isApproved: store.isApproved ?? true,
            createdAt: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
            productCount: 0,
          }
        }
      })
    )

    return NextResponse.json(
      {
        success: true,
        message: "Stores fetched successfully",
        stores: storesWithCounts,
        count: storesWithCounts.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Error fetching stores:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stores",
        error: error.message || "Internal server error",
        stores: [], // Return empty array so the page doesn't crash
        count: 0,
      },
      { status: 500 }
    )
  }
}