import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Category, { type ICategory } from "@/models/Category"
import Store from "@/models/Store"
import type { CategoriesApiResponse, CategoryResponse, ApiErrorResponse } from "@/app/types/api"

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse<CategoriesApiResponse>> {
  try {
    const { slug } = await params

    console.log("API: Fetching categories for store slug:", slug)

    // Validate slug
    if (!slug) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store slug is required",
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    console.log("Attempting to connect to DB for public store categories...")
    await connectToDB()
    console.log("DB connected for public store categories")

    // Find store by slug first
    console.log("Searching for store with slug:", slug)
    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })

    console.log("Store found for public categories:", store ? store.name : "None")

    if (!store) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        message: "Store not found or not published",
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // Find categories belonging to this store
    console.log("Searching for categories for storeId:", store._id)
    const categories: ICategory[] = await Category.find({
      storeId: store._id,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean()

    console.log("API: Found categories:", categories.length)

    // Transform the categories to match the expected frontend format
    const transformedCategories: CategoryResponse[] = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      description: category.description || null,
      store_id: category.storeId.toString(),
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    }))

    const successResponse: CategoriesApiResponse = {
      success: true,
      categories: transformedCategories,
      count: transformedCategories.length,
    }

    return NextResponse.json(successResponse, { status: 200 })
  } catch (error: unknown) {
    console.error("API Error fetching public store categories:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories"
    const errorResponse: ApiErrorResponse = {
      success: false,
      message: errorMessage,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
