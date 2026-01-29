import { NextResponse } from "next/server"
import Store from "@/models/Store"
import Product from "@/models/Product"
import { getUserFromCookies } from "@/lib/auth"
import { connectToDB } from "@/lib/db"

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

    // ✅ Convert Mongoose documents to plain objects
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
      imageCount: body.images?.length,
      hasVariants: body.hasVariants,
      variantCount: body.variants?.length
    })

    const { name, description, price, compareAtPrice, category, inventoryQuantity, images, storeId, hasVariants, variants } = body

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

    const productCount = await Product.countDocuments({ storeId: store._id })
    console.log("📦 Current product count:", productCount)

    // Plan limits based on your subscription tiers
    const planLimits: Record<string, number> = {
      free: 10,      // Free: Up to 10 products
      basic: 20,     // Basic: Up to 20 products  
      standard: 50,  // Standard: Up to 50 products
      premium: 999999, // Premium: Unlimited (using large number)
    }

    const productLimit = planLimits[subscriptionPlan] || 10
    const isUnlimited = productLimit >= 999999

    if (productCount >= productLimit) {
      console.error("❌ Product limit reached:", { current: productCount, limit: productLimit, plan: subscriptionPlan })
      
      return NextResponse.json(
        {
          message: isUnlimited 
            ? "You've reached the maximum number of products." 
            : `You've reached the product limit (${productLimit}) for your ${subscriptionPlan} plan. Upgrade to add more products.`,
          currentCount: productCount,
          limit: isUnlimited ? "unlimited" : productLimit,
          plan: subscriptionPlan,
          upgradeUrl: "/dashboard/seller/subscriptions",
        },
        { status: 400 }
      )
    }

    console.log(`✅ Product limit check passed: ${productCount}/${isUnlimited ? '∞' : productLimit}`)


    // ✅ Create product
    console.log("🚀 Creating product...")
    
    const productData = {
      name,
      description,
      price,
      compareAtPrice,
      category: category || undefined,
      inventoryQuantity,
      images: images || [],
      hasVariants: hasVariants || false,
      variants: hasVariants ? variants || [] : [],
      storeId: store._id,
      sellerId: user.id,
    }
    
    console.log("📝 Product data:", productData)
    console.log(`[v0] Creating product with variants: hasVariants=${productData.hasVariants}, variantCount=${productData.variants.length}`)
    
    const product = await Product.create(productData)

    console.log("✅ Product created:", product._id)

    // Convert to plain object
    const productObj = product.toObject()
    const productWithId = {
      ...productObj,
      _id: productObj._id.toString(),
    }

    return NextResponse.json(
      {
        success: true,
        product: productWithId,
        message: `Product created successfully!`,
        stats: {
          currentCount: productCount + 1,
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