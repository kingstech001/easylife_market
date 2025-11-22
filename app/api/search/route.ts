import { NextRequest, NextResponse } from "next/server"
import Store from "@/models/Store"
import Product from "@/models/Product"
import type { Types } from "mongoose"
import { connectToDB } from "@/lib/db"

interface StoreDocument {
  _id: Types.ObjectId
  name: string
  description?: string
  slug: string
  logo_url?: string
  categories?: string[]
  location?: string
}

interface ProductDocument {
  _id: Types.ObjectId
  name: string
  description?: string
  price: number
  images?: Array<{ url: string; altText?: string } | string>
  storeId?: Types.ObjectId
}

export async function GET(request: NextRequest) {
  try {
    await connectToDB()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { stores: [], products: [] },
        { status: 200 }
      )
    }

    // Create case-insensitive regex for search
    const searchRegex = new RegExp(query.trim(), "i")

    // Search stores - only published and approved ones
    const storesPromise = Store.find({
      isPublished: true,
      isApproved: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { slug: searchRegex },
      ],
    })
      .select("_id name description slug logo_url categories location")
      .limit(5)
      .lean<StoreDocument[]>()

    // First, get all approved and published store IDs
    const approvedStores = await Store.find({
      isPublished: true,
      isApproved: true,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>()

    const approvedStoreIds = approvedStores.map(store => store._id)

    // Search products - only active ones from approved stores
    const productsPromise = Product.find({
      isActive: true,
      isDeleted: false,
      storeId: { $in: approvedStoreIds }, // ✅ Only fetch products from approved stores
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ],
    })
      .select("_id name description price images storeId")
      .limit(10)
      .lean<ProductDocument[]>()

    // Execute both queries in parallel
    const [stores, products] = await Promise.all([storesPromise, productsPromise])

    // Get unique store IDs from products to fetch their slugs
    const productStoreIds = [...new Set(products.map(p => p.storeId).filter(Boolean))]
    
    // Fetch store slugs for products
    const productStores = await Store.find({
      _id: { $in: productStoreIds }
    })
      .select("_id slug")
      .lean<{ _id: Types.ObjectId; slug: string }[]>()
    
    // Create a map of storeId to slug
    const storeSlugMap: Record<string, string> = {}
    productStores.forEach(store => {
      storeSlugMap[store._id.toString()] = store.slug
    })

    // Format the response
    const formattedStores = stores.map((store) => ({
      _id: store._id.toString(),
      businessName: store.name,
      description: store.description || "",
      slug: store.slug,
      logo: store.logo_url || "",
      location: store.location || "",
      categories: store.categories || [],
    }))

    const formattedProducts = products.map((product) => {
      const storeIdStr = product.storeId?.toString() || ""
      const firstImage = product.images && product.images.length > 0 
        ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any)?.url)
        : null
      
      return {
        _id: product._id.toString(),
        name: product.name,
        description: product.description || "",
        price: product.price,
        image: firstImage,
        storeId: storeIdStr,
        storeSlug: storeSlugMap[storeIdStr] || storeIdStr,
      }
    })

    return NextResponse.json(
      {
        stores: formattedStores,
        products: formattedProducts,
        totalResults: formattedStores.length + formattedProducts.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Failed to perform search", stores: [], products: [] },
      { status: 500 }
    )
  }
}