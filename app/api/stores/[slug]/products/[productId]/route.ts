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

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; productId: string } }
): Promise<NextResponse<ProductDetailApiResponse | ApiErrorResponse>> {
  try {
    const { slug, productId } = await params

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
      return NextResponse.json(
        { success: false, message: "Store not found or not published" },
        { status: 404 }
      )
    }

    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      storeId: store._id,
      isActive: true,
      isDeleted: false,
    })
      .populate("categoryId", "name")
      .lean()

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found or not available" },
        { status: 404 }
      )
    }

    const transformedProduct: ProductResponse = {
      id: product._id.toString(),
      name: product.name,
      description: product.description || null,
      price: product.price,
      compare_at_price: product.compareAtPrice || null,
      category_id: product.categoryId?._id?.toString() || null,
      inventory_quantity: product.inventoryQuantity,
      images:
        product.images?.map((img) => ({
          id: img._id?.toString() || crypto.randomUUID(),
          url: img.url,
          alt_text: img.altText || null,
        })) || [],
      store_id: product.storeId.toString(),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }

    return NextResponse.json({ success: true, product: transformedProduct }, { status: 200 })
  } catch (error: unknown) {
    console.error("Product API error:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 }
    )
  }
}
