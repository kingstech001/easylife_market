import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product, { type IProduct } from "@/models/Product"
import Store from "@/models/Store"
import type { ProductsApiResponse, ProductResponse, ApiErrorResponse } from "@/app/types/api"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ProductsApiResponse>> {
  try {
    const { slug } = await params

    console.log("API: Fetching products for store slug:", slug)

    // Validate slug
    if (!slug) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug is required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    console.log("Attempting to connect to DB for public store products...")
    await connectToDB()
    console.log("DB connected for public store products")

    // Find store by slug first (like your main store route)
    console.log("Searching for store with slug:", slug)
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    console.log("Store found for public products:", store ? store.name : "None")

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

    // Find products belonging to this store with more flexible filtering
    console.log("Searching for products for storeId:", store._id)

    // First, let's see what products exist for this store without filters
    const allStoreProducts = await Product.find({
      storeId: store._id,
    }).lean()

    console.log("All products for this store (no filters):", allStoreProducts.length)
    console.log(
      "Sample products:",
      allStoreProducts.slice(0, 2).map((p) => ({
        id: p._id.toString(),
        name: p.name,
        isActive: p.isActive,
        isDeleted: p.isDeleted,
      })),
    )

    // Now apply filters more carefully
    const filter: any = {
      storeId: store._id,
    }

    // Only add isActive filter if the field exists
    if (allStoreProducts.length > 0 && "isActive" in allStoreProducts[0]) {
      filter.isActive = true
    }

    // Only add isDeleted filter if the field exists
    if (allStoreProducts.length > 0 && "isDeleted" in allStoreProducts[0]) {
      filter.isDeleted = false
    }

    console.log("Applied filter:", filter)

    const products: IProduct[] = await Product.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean()

    console.log("API: Found products after filtering:", products.length)

    // Transform the products to match the expected frontend format
    const transformedProducts: ProductResponse[] = products.map((product) => ({
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
    }))

    const successResponse: ProductsApiResponse = {
      success: true,
      products: transformedProducts,
      count: transformedProducts.length,
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error("API Error fetching public store products:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: errorMessage,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
