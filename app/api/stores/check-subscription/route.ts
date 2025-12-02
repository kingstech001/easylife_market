import { NextRequest, NextResponse } from "next/server"
import Store from "@/models/Store"
import { enforceProductLimitForStore } from "@/lib/subscriptions/enforceProductLimit"
import { connectToDB } from "@/lib/db"

/**
 * POST /api/stores/check-subscription
 * 
 * Checks if a store's subscription has expired and downgrades if needed.
 * Automatically enforces product limits.
 * 
 * Request body: { storeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB()
    
    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }


    const store = await Store.findById(storeId)
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    const now = new Date()
    let action = "checked"
    let wasDowngraded = false

    // Check if subscription has expired
    const hasExpired = store.subscriptionEndDate && new Date(store.subscriptionEndDate) < now

    if (hasExpired && store.subscriptionPlan !== "free") {

      // Downgrade to free plan
      store.subscriptionPlan = "free"
      store.productLimit = 10
      store.subscriptionStartDate = null
      store.subscriptionEndDate = null
      await store.save()

      action = "downgraded"
      wasDowngraded = true

    }

    // Enforce product limit (whether downgraded or not)
    const enforcementResult = await enforceProductLimitForStore(store._id)

    const message = wasDowngraded
      ? "Subscription expired and downgraded to free. Product limit enforced."
      : "Subscription checked and product limit enforced."

    return NextResponse.json(
      {
        success: true,
        message,
        action,
        wasDowngraded,
        store: {
          id: store._id,
          name: store.name,
          plan: store.subscriptionPlan,
          productLimit: store.productLimit,
          subscriptionEndDate: store.subscriptionEndDate,
        },
        enforcement: enforcementResult,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ check-subscription error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}