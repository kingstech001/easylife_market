import { NextResponse } from "next/server"
import Store from "@/models/Store"
import Product from "@/models/Product"
import { getUserFromCookies } from "@/lib/auth"
import { connectToDB } from "@/lib/db"
import enforceProductLimit from "@/lib/enforceProductLimit"

// Product limits per plan
const PRODUCT_LIMITS: Record<string, number | null> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: null, // unlimited
}

export async function GET(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can access this route." },
        { status: 401 },
      )
    }

    let store
    if (user.role === "admin") {
      store = await Store.findOne({ sellerId: user.id })
    } else {
      store = await Store.findOne({ sellerId: user.id })
    }

    if (!store) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 })
    }

    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 })

    const productsWithId = products.map(product => {
      const productObj = product.toObject()
      return {
        ...productObj,
        _id: productObj._id.toString(),
      }
    })

    return NextResponse.json({ store, products: productsWithId }, { status: 200 })
  } catch (error) {
    console.error("❌ GET /api/seller/products error:", error)
    return NextResponse.json({ message: "Internal Server Error", error: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    console.log("📥 POST /api/dashboard/seller/products - Request received")
    
    await connectToDB()

    const user = await getUserFromCookies()
    console.log("👤 User:", { id: user?.id, role: user?.role })
    
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      console.error("❌ Unauthorized user")
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can add products." },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log("📦 Request body:", {
      name: body.name,
      price: body.price,
      inventoryQuantity: body.inventoryQuantity,
      storeId: body.storeId,
      hasImages: !!body.images,
      imageCount: body.images?.length
    })

    const { name, description, price, compareAtPrice, category, inventoryQuantity, images, storeId } = body

    // ✅ Detailed validation with specific error messages
    if (!name) {
      console.error("❌ Missing name")
      return NextResponse.json({ message: "Product name is required" }, { status: 400 })
    }

    if (!price || price <= 0) {
      console.error("❌ Invalid price:", price)
      return NextResponse.json({ message: "Valid price is required" }, { status: 400 })
    }

    if (inventoryQuantity === undefined || inventoryQuantity === null) {
      console.error("❌ Missing inventory quantity")
      return NextResponse.json({ message: "Inventory quantity is required" }, { status: 400 })
    }

    if (!storeId) {
      console.error("❌ Missing storeId")
      return NextResponse.json({ message: "Store ID is required" }, { status: 400 })
    }

    // ✅ Find store with better error messages
    console.log("🔍 Looking for store:", storeId)
    let store
    if (user.role === "admin") {
      store = await Store.findById(storeId)
    } else {
      store = await Store.findOne({ _id: storeId, sellerId: user.id })
    }

    if (!store) {
      console.error("❌ Store not found or unauthorized:", { storeId, userId: user.id })
      return NextResponse.json(
        { message: "Store not found or you don't have permission to add products to it" },
        { status: 404 }
      )
    }

    console.log("✅ Store found:", store._id)

    // ✅ Check subscription plan limits
    const subscriptionPlan = store.subscriptionPlan || "free"
    console.log("📊 Subscription plan:", subscriptionPlan)

    // Count only ACTIVE products (isActive: true)
    const activeProductCount = await Product.countDocuments({ 
      storeId: store._id, 
      isDeleted: false,
      isActive: true 
    })
    console.log("📦 Current ACTIVE product count:", activeProductCount)

    const productLimit = PRODUCT_LIMITS[subscriptionPlan]
    const isUnlimited = productLimit === null

    // Check if limit is reached
    if (!isUnlimited && activeProductCount >= productLimit) {
      console.error("❌ Product limit reached:", { 
        current: activeProductCount, 
        limit: productLimit, 
        plan: subscriptionPlan 
      })
      
      return NextResponse.json(
        {
          message: `You've reached the product limit (${productLimit}) for your ${subscriptionPlan} plan. Upgrade to add more products.`,
          currentCount: activeProductCount,
          limit: productLimit,
          plan: subscriptionPlan,
          upgradeUrl: "/dashboard/seller/subscriptions",
        },
        { status: 400 }
      )
    }

    console.log(`✅ Product limit check passed: ${activeProductCount}/${isUnlimited ? '∞' : productLimit}`)

    // ✅ Create product (always create as active)
    console.log("🚀 Creating product...")
    
    const productData = {
      name,
      description,
      price,
      compareAtPrice,
      category: category || undefined,
      inventoryQuantity,
      images: images || [],
      storeId: store._id,
      sellerId: user.id,
      isActive: true, // Always create as active
    }
    
    console.log("📝 Product data:", productData)
    
    const product = await Product.create(productData)

    console.log("✅ Product created:", product._id)

    // ✅ Enforce product limit (will deactivate oldest if needed)
    try {
      const result = await enforceProductLimit(storeId, productLimit)
      console.log(`📊 Enforced product limit after creation:`, result)
    } catch (error) {
      console.error("❌ Failed to enforce product limit:", error)
      // Don't fail the entire request
    }

    // Reload product to check if it's still active
    const updatedProduct = await Product.findById(product._id)
    
    // Convert to plain object
    const productObj = updatedProduct!.toObject()
    const productWithId = {
      ...productObj,
      _id: productObj._id.toString(),
    }

    return NextResponse.json(
      {
        success: true,
        product: productWithId,
        message: updatedProduct!.isActive 
          ? `Product created successfully!`
          : `Product created but deactivated due to plan limit. Upgrade your plan or delete older products.`,
        stats: {
          currentCount: activeProductCount + 1,
          limit: isUnlimited ? "unlimited" : productLimit,
          plan: subscriptionPlan,
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("❌ POST /api/seller/products error:", error)
    console.error("Stack trace:", error.stack)
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A product with this name already exists in your store." },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        message: "Failed to create product",
        error: String(error),
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}