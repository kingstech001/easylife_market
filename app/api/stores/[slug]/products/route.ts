import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Product from "@/models/Product"
import type { SearchProductsApiResponse, ProductResponse, ApiErrorResponse } from "@/app/types/api"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<SearchProductsApiResponse>> {
  try {
    const { slug } = await params

    console.log('🔍 Searching products for store slug:', slug)

    // Validate slug
    if (!slug) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug is required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    await connectToDB()

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Find store by slug first
    const Store = (await import("@/models/Store")).default
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

    // Build filter
    const filter: any = {
      storeId: store._id,
      isActive: true,
      isDeleted: false,
    }

    // Add search query if provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ]
    }

    // Add category filter
    if (category) {
      filter.categoryId = category
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice)
    }

    // Determine sort order
    const sort: any = {}
    switch (sortBy) {
      case 'price-asc':
        sort.price = 1
        break
      case 'price-desc':
        sort.price = -1
        break
      case 'name-asc':
        sort.name = 1
        break
      case 'name-desc':
        sort.name = -1
        break
      case 'newest':
      default:
        sort.createdAt = -1
        break
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch products and total count - use any type for lean() results
    const [products, totalCount]: [any[], number] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ])

    // Transform the products
    const transformedProducts: ProductResponse[] = products.map((product: any) => {
      try {
        // Check if product has variants
        const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
        
        return {
          id: product._id.toString(),
          name: product.name || "Untitled Product",
          description: product.description || null,
          price: product.price || 0,
          compare_at_price: product.compareAtPrice || null,
          category_id: product.categoryId?._id?.toString() || product.categoryId?.toString() || null,
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
          // ⭐ CORRECT VARIANT STRUCTURE ⭐
          hasVariants: hasVariants,
          variants: hasVariants ? product.variants.map((variant: any) => ({
            color: {
              name: variant.color?.name || '',
              hex: variant.color?.hex || '#000000',
              _id: variant.color?._id?.toString()
            },
            sizes: Array.isArray(variant.sizes) ? variant.sizes.map((size: any) => ({
              size: size.size || '',
              quantity: size.quantity || 0,
              _id: size._id?.toString()
            })) : [],
            priceAdjustment: variant.priceAdjustment || 0,
            _id: variant._id?.toString()
          })) : undefined,
        }
      } catch (transformError) {
        console.error('❌ Error transforming product:', product._id, transformError)
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
          hasVariants: false,
          variants: undefined,
        }
      }
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)

    const successResponse: SearchProductsApiResponse = {
      success: true,
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error('❌ Error in GET /api/stores/[slug]/products/search:', error)
    
    const errorMessage = error instanceof Error ? error.message : "Failed to search products"
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