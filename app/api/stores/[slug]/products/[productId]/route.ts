import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product, { type IProduct } from "@/models/Product"
import Store from "@/models/Store"
import mongoose from "mongoose"
import type { ProductResponse, ApiErrorResponse } from "@/app/types/api"

interface RouteParams {
  params: Promise<{ slug: string; productId: string }>
}

interface ProductDetailApiResponse {
  success: true
  product: ProductResponse
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ProductDetailApiResponse | ApiErrorResponse>> {
  try {
    const { slug, productId } = await params
    console.log("API: Fetching product:", productId, "from store:", slug)

    // Validate parameters
    if (!slug || !productId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug and product ID are required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Invalid product ID format",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    console.log("Attempting to connect to DB for product detail...")
    await connectToDB()
    console.log("DB connected for product detail")

    // Find store by slug first (same as your products listing)
    console.log("Searching for store with slug:", slug)
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    console.log("Store found for product detail:", store ? store.name : "None")

    if (!store) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store not found or not published",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    console.log("Store details:", {
      id: store._id.toString(),
      name: store.name,
      slug: store.slug,
      sellerId: store.sellerId?.toString(),
      owner_id: store.owner_id?.toString(),
    })

    // Find the specific product
    console.log("Searching for product with ID:", productId, "in store:", store._id)

    // First check if product exists for this store without filters
    const productExists = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      storeId: store._id,
    }).lean()

    console.log("Product exists check:", productExists ? "Found" : "Not found")

    if (!productExists) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Product not found in this store",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Build filter similar to your products listing logic
    const filter: any = {
      _id: new mongoose.Types.ObjectId(productId),
      storeId: store._id,
    }

    // Only add isActive filter if the field exists
    if ("isActive" in productExists) {
      filter.isActive = true
    }

    // Only add isDeleted filter if the field exists
    if ("isDeleted" in productExists) {
      filter.isDeleted = false
    }

    console.log("Applied filter for product detail:", filter)

    const product: IProduct | null = await Product.findOne(filter).populate("categoryId", "name").lean()

    console.log("Product found after filtering:", product ? "Yes" : "No")

    if (!product) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Product not found or not available",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Transform product data (same format as your products listing)
    const transformedProduct: ProductResponse = {
      id: product._id.toString(),
      name: product.name,
      description: product.description || null,
      price: product.price,
      compare_at_price: product.compareAtPrice || null,
      category_id: product.categoryId?.toString() || null,
      inventory_quantity: product.inventoryQuantity,
      images:
        product.images?.map((img) => ({
          id: img._id?.toString() || Math.random().toString(),
          url: img.url,
          alt_text: img.altText || null,
        })) || [],
      store_id: product.storeId.toString(),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }

    const successResponse: ProductDetailApiResponse = {
      success: true,
      product: transformedProduct,
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error("API Error fetching product detail:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch product"
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: errorMessage,
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
