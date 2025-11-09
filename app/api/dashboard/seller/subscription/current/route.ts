import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { getUserFromCookies } from "@/lib/auth" // Adjust path to your auth file

// Utility to check if a plan is expired
function isPlanExpired(endDate?: Date | null): boolean {
  if (!endDate) return false // free plan or no expiry
  return new Date().getTime() > new Date(endDate).getTime()
}

// GET method - more RESTful for fetching data
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from cookies
    const user = await getUserFromCookies()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a seller
    if (user.role !== "seller") {
      return NextResponse.json({ error: "Access denied. Seller role required." }, { status: 403 })
    }

    // Extract storeId from query params
    const { searchParams } = new URL(request.url)
    const queryStoreId = searchParams.get("storeId")

    // Connect to MongoDB
    await connectToDB()

    // If "current" is passed, find store by sellerId, otherwise use provided storeId
    let store
    if (queryStoreId === "current") {
      store = await Store.findOne({ sellerId: user.id })
    } else if (queryStoreId) {
      // Verify ownership when specific storeId is provided
      store = await Store.findOne({ _id: queryStoreId, sellerId: user.id })
    } else {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    if (!store) {
      return NextResponse.json({ error: "Store not found or access denied" }, { status: 404 })
    }

    const expired = isPlanExpired(store.subscriptionEndDate)
    let currentPlan = store.subscriptionPlan || "free"

    // Auto downgrade if plan expired
    if (expired && currentPlan !== "free") {
      store.subscriptionPlan = "free"
      store.subscriptionStartDate = null
      store.subscriptionEndDate = null
      await store.save()
      currentPlan = "free"
    }

    return NextResponse.json(
      {
        success: true,
        storeId: store._id.toString(),
        storeName: store.name,
        email: store.email || user.email,
        plan: currentPlan,
        startDate: store.subscriptionStartDate || null,
        endDate: store.subscriptionEndDate || null,
        expired,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Fetch subscription error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined }, 
      { status: 500 }
    )
  }
}

// POST method - for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from cookies
    const user = await getUserFromCookies()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a seller
    if (user.role !== "seller") {
      return NextResponse.json({ error: "Access denied. Seller role required." }, { status: 403 })
    }

    const body = await request.json()
    
    const { storeId: bodyStoreId } = body

    // Connect to MongoDB
    await connectToDB()

    // If "current" is passed, find store by sellerId, otherwise use provided storeId
    let store
    if (bodyStoreId === "current") {
      store = await Store.findOne({ sellerId: user.id })
    } else if (bodyStoreId) {
      // Verify ownership when specific storeId is provided
      store = await Store.findOne({ _id: bodyStoreId, sellerId: user.id })
    } else {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    if (!store) {
      return NextResponse.json({ error: "Store not found or access denied" }, { status: 404 })
    }

    const expired = isPlanExpired(store.subscriptionEndDate)
    let currentPlan = store.subscriptionPlan || "free"

    // Auto downgrade if plan expired
    if (expired && currentPlan !== "free") {
      store.subscriptionPlan = "free"
      store.subscriptionStartDate = null
      store.subscriptionEndDate = null
      await store.save()
      currentPlan = "free"
    }

    return NextResponse.json(
      {
        success: true,
        storeId: store._id.toString(),
        storeName: store.name,
        email: store.email || user.email,
        plan: currentPlan,
        startDate: store.subscriptionStartDate || null,
        endDate: store.subscriptionEndDate || null,
        expired,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Fetch subscription error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: process.env.NODE_ENV === "development" ? error.message : undefined }, 
      { status: 500 }
    )
  }
}