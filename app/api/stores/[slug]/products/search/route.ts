import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product from "@/models/Product"
import Store from "@/models/Store"
import type { SearchProductsApiResponse, ProductResponse, PaginationResponse, ApiErrorResponse } from "@/app/types/api"
import mongoose from "mongoose"

interface RouteParams {
  params: Promise<{ slug: string }>
}

interface SearchFilters {
  storeId: mongoose.Types.ObjectId
  isActive: boolean
  isDeleted: boolean
  $text?: { $search: string }
  categoryId?: mongoose.Types.ObjectId
  price?: {
    $gte?: number
    $lte?: number
  }
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse<SearchProductsApiResponse>> {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    // Extract search parameters
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100) // Max 100 items per page
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Validate slug
    if (!slug) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug is required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    await connectToDB()

    // First, find the store by slug and verify it's published
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    if (!store) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store not found or not published",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Build search filter using the store's ObjectId
    const filter: SearchFilters = {
      storeId: store._id,
      isActive: true,
      isDeleted: false,
    }

    // Text search
    if (query.trim()) {
      filter.$text = { $search: query.trim() }
    }

    // Category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.categoryId = new mongoose.Types.ObjectId(category)
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) {
        const min = Number.parseFloat(minPrice)
        if (!Number.isNaN(min) && min >= 0) {
          filter.price.$gte = min
        }
      }
      if (maxPrice) {
        const max = Number.parseFloat(maxPrice)
        if (!Number.isNaN(max) && max >= 0) {
          filter.price.$lte = max
        }
      }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    const validSortFields = ["createdAt", "updatedAt", "name", "price", "inventoryQuantity"]
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt"
    sort[sortField] = sortOrder === "desc" ? -1 : 1

    // Execute query with pagination
    const skip = Math.max(0, (page - 1) * limit)

    // Use any[] type for lean() results since they're flattened MongoDB documents
    const [products, totalCount]: [any[], number] = await Promise.all([
      Product.find(filter).populate("categoryId", "name").sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ])

    // Transform products with safe property access
    const transformedProducts: ProductResponse[] = products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description || null,
      price: product.price,
      compare_at_price: product.compareAtPrice || null,
      category_id: product.categoryId?._id?.toString() || product.categoryId?.toString() || null,
      inventory_quantity: product.inventoryQuantity,
      images:
        product.images?.map((img: any, index: number) => ({
          id: img._id?.toString() || `img-${index}`,
          url: img.url,
          alt_text: img.altText || null,
        })) || [],
      store_id: product.storeId.toString(),
      created_at: product.createdAt || new Date(),
      updated_at: product.updatedAt || new Date(),
    }))

    const pagination: PaginationResponse = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    }

    const successResponse: SearchProductsApiResponse = {
      success: true,
      products: transformedProducts,
      pagination,
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error("API Error searching products:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to search products"
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: errorMessage,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}