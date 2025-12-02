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
  location?: {
    type: string
    coordinates: [number, number]
    address: string
    city?: string
    state?: string
    country: string
  }
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
  location?: {
    type: string
    coordinates: [number, number]
    address: string
    city?: string
    state?: string
    country: string
  }
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

// ✅ GET: Fetch All Published Stores (with optional location filtering)
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {

    await connectToDB()

    // Get query parameters for location-based filtering (optional)
    const searchParams = req.nextUrl.searchParams
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const maxDistance = searchParams.get("maxDistance") // in meters (e.g., 5000 = 5km)

    // Build query
    const query: any = { isPublished: true, isApproved: true  }
    
    // Add location-based filtering if coordinates provided
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)
      const distance = maxDistance ? parseInt(maxDistance) : 10000 // Default 10km

      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // [lng, lat] order for GeoJSON
          },
          $maxDistance: distance,
        },
      }
    }

    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .lean<StoreDocument[]>()
      .exec()


    // ✅ Add product count for each store
    const storesWithCounts: StoreResponse[] = await Promise.all(
      stores.map(async (store): Promise<StoreResponse> => {
        try {
          const productCount = await Product.countDocuments({ 
            storeId: store._id,
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
            location: store.location ? {
              type: store.location.type,
              coordinates: store.location.coordinates,
              address: store.location.address,
              city: store.location.city,
              state: store.location.state,
              country: store.location.country,
            } : undefined,
            createdAt: store.createdAt ? store.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: store.updatedAt ? store.updatedAt.toISOString() : new Date().toISOString(),
            productCount,
          }
        } catch (err) {
          console.error(`Error processing store ${store._id}:`, err)
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
            location: store.location,
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
        stores: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}