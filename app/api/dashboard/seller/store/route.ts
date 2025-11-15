import { NextResponse } from "next/server"
import Store from "@/models/Store"
import { getUserFromCookies } from "@/lib/auth"
import { connectToDB } from "@/lib/db"

// ✅ GET - Fetch store information
export async function GET() {
  try {
    await connectToDB()

    const user = await getUserFromCookies()

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can access this route." },
        { status: 401 }
      )
    }

    const store = await Store.findOne({ sellerId: user.id })

    if (!store) {
      return NextResponse.json(
        { message: "Store not found for this user." },
        { status: 404 }
      )
    }

    // Return store with role
    return NextResponse.json(
      { 
        success: true,
        store: {
          _id: store._id.toString(),
          name: store.name,
          slug: store.slug,
          description: store.description || "",
          logo_url: store.logo_url || "",
          banner_url: store.banner_url || "",
          subscriptionPlan: store.subscriptionPlan || "free",
          subscriptionStatus: store.subscriptionStatus || "active",
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        },
        role: user.role 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ GET /api/dashboard/seller/store error:", error)
    return NextResponse.json(
      { 
        success: false,
        message: "Internal Server Error", 
        error: String(error) 
      },
      { status: 500 }
    )
  }
}

// ✅ PUT - Update store information
export async function PUT(req: Request) {
  try {
    await connectToDB()

    const user = await getUserFromCookies()

    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Only sellers or admins can update store." },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log("📥 Update request body:", {
      name: body.name,
      description: body.description?.substring(0, 50),
      hasLogo: !!body.logo_url,
      hasBanner: !!body.banner_url,
    })

    const { name, description, logo_url, banner_url } = body

    // Find the store
    const store = await Store.findOne({ sellerId: user.id })

    if (!store) {
      return NextResponse.json(
        { 
          success: false,
          message: "Store not found." 
        },
        { status: 404 }
      )
    }

    // Validate name if provided
    if (name && name.trim().length < 3) {
      return NextResponse.json(
        { 
          success: false,
          message: "Store name must be at least 3 characters long." 
        },
        { status: 400 }
      )
    }

    // Update store fields only if provided
    if (name !== undefined && name.trim() !== "") {
      store.name = name.trim()
    }
    
    if (description !== undefined) {
      store.description = description.trim()
    }
    
    if (logo_url !== undefined) {
      store.logo_url = logo_url
    }
    
    if (banner_url !== undefined) {
      store.banner_url = banner_url
    }

    // Save changes - use validateBeforeSave: false to skip required field validation
    await store.save({ validateBeforeSave: false })

    console.log("✅ Store updated successfully:", store._id)

    return NextResponse.json(
      { 
        success: true,
        message: "Store updated successfully",
        store: {
          _id: store._id.toString(),
          name: store.name,
          slug: store.slug,
          description: store.description || "",
          logo_url: store.logo_url || "",
          banner_url: store.banner_url || "",
          subscriptionPlan: store.subscriptionPlan || "free",
          subscriptionStatus: store.subscriptionStatus || "active",
          updatedAt: store.updatedAt,
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ PUT /api/dashboard/seller/store error:", error)
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to update store", 
        error: error.message || String(error),
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}