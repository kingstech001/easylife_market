import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product, { type IProduct } from "@/models/Product"
import Store from "@/models/Store"
import mongoose from "mongoose"
import type { ProductResponse, ApiErrorResponse } from "@/app/types/api"

interface ProductDetailApiResponse {
  success: true
  product: ProductResponse
}

interface RouteParams {
  params: Promise<{ slug: string; productId: string }>
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ProductDetailApiResponse | ApiErrorResponse>> {
  try {
    const { slug, productId } = await params

    console.log('🔍 Fetching product:', productId, 'from store:', slug)

    if (!slug || !productId) {
      return NextResponse.json(
        { success: false, message: "Store slug and product ID are required" },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID format" },
        { status: 400 }
      )
    }

    await connectToDB()

    const store = await Store.findOne({ slug, isPublished: true })
    if (!store) {
      console.log('❌ Store not found for slug:', slug)
      return NextResponse.json(
        { success: false, message: "Store not found or not published" },
        { status: 404 }
      )
    }

    console.log('✅ Store found:', store.name)

    // Build query filter - only include isActive/isDeleted if they exist in schema
    const query: any = {
      _id: new mongoose.Types.ObjectId(productId),
      storeId: store._id,
    }

    // Check if these fields exist before filtering on them
    const sampleProduct = await Product.findOne({ storeId: store._id }).lean()
    if (sampleProduct) {
      if ("isActive" in sampleProduct) query.isActive = true
      if ("isDeleted" in sampleProduct) query.isDeleted = false
    }

    console.log('🔍 Query filter:', query)

    // ✅ FIXED: Removed .populate("categoryId") - doesn't exist in schema
    const product = await Product.findOne(query).lean()

    if (!product) {
      console.log('❌ Product not found:', productId)
      return NextResponse.json(
        { success: false, message: "Product not found or not available" },
        { status: 404 }
      )
    }

    console.log('✅ Product found:', product.name)

    // Transform product safely
    const transformedProduct: ProductResponse = {
      id: product._id.toString(),
      name: product.name || "Untitled Product",
      description: product.description || null,
      price: product.price || 0,
      compare_at_price: product.compareAtPrice || null,
      // ✅ FIXED: Handle category as string (not populated reference)
      category_id: product.category ? product.category.toString() : null,
      inventory_quantity: product.inventoryQuantity || 0,
      images: Array.isArray(product.images)
        ? product.images.map((img: any, index: number) => ({
            id: img._id?.toString() || `img-${index}`,
            url: img.url || "",
            alt_text: img.altText || img.alt_text || null,
          }))
        : [],
      store_id: product.storeId.toString(),
      created_at: product.createdAt || new Date(),
      updated_at: product.updatedAt || new Date(),
    }

    console.log('✅ Product transformed successfully')

    return NextResponse.json({ success: true, product: transformedProduct }, { status: 200 })
  } catch (error: unknown) {
    console.error("❌ Product API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch product"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error message:', errorMessage)
    console.error('Error stack:', errorStack)
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}