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

    console.log('🔍 Fetching products for store slug:', slug)

    // Validate slug
    if (!slug) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug is required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    await connectToDB()

    // Find store by slug first
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    if (!store) {
      console.log('❌ Store not found for slug:', slug)
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store not found or not published",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    console.log('✅ Store found:', store.name, 'ID:', store._id)

    // First, check what products exist for this store
    const allStoreProducts = await Product.find({
      storeId: store._id,
    }).lean()

    console.log('📦 Total products found for store:', allStoreProducts.length)

    // Build filter carefully
    const filter: any = {
      storeId: store._id,
    }

    // Only add filters if the fields exist in the schema
    if (allStoreProducts.length > 0) {
      const sampleProduct = allStoreProducts[0]
      if ("isActive" in sampleProduct) {
        filter.isActive = true
      }
      if ("isDeleted" in sampleProduct) {
        filter.isDeleted = false
      }
    }

    console.log('🔍 Using filter:', filter)

    // Fetch products - don't populate categoryId since it might not exist or be a string
    const products: IProduct[] = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    console.log('✅ Products after filtering:', products.length)

    // Transform the products safely
    const transformedProducts: ProductResponse[] = products.map((product) => {
      try {
        return {
          id: product._id.toString(),
          name: product.name || "Untitled Product",
          description: product.description || null,
          price: product.price || 0,
          compare_at_price: product.compareAtPrice || null,
          // Handle category - it might be a string or ObjectId
          category_id: product.category ? product.category.toString() : null,
          inventory_quantity: product.inventoryQuantity || 0,
          // Safely transform images
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
      } catch (transformError) {
        console.error('❌ Error transforming product:', product._id, transformError)
        // Return a basic product structure to avoid breaking the entire response
        return {
          id: product._id?.toString() || "unknown",
          name: product.name || "Error loading product",
          description: null,
          price: 0,
          compare_at_price: null,
          category_id: null,
          inventory_quantity: 0,
          images: [],
          store_id: product.storeId?.toString() || "",
          created_at: new Date(),
          updated_at: new Date(),
        }
      }
    })

    console.log('✅ Successfully transformed products:', transformedProducts.length)

    const successResponse: ProductsApiResponse = {
      success: true,
      products: transformedProducts,
      count: transformedProducts.length,
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error('❌ Error in GET /api/stores/[slug]/products:', error)
    
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch products"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error message:', errorMessage)
    console.error('Error stack:', errorStack)
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: errorMessage,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}