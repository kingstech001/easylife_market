// app/api/stores/check-subscription/route.ts
import { NextRequest, NextResponse } from "next/server"
import Store from "@/models/Store"
import { enforceProductLimitForStore } from "@/lib/subscriptions/enforceProductLimit"
import { connectToDB } from "@/lib/db"

/**
 * POST /api/stores/check-subscription
 *
 * Checks subscription expiry and downgrades if expired.
 * ✅ FIXED: Properly updates productLimit when downgrading using markModified()
 * 
 * Request body: { storeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDB()

    const { storeId } = await request.json()

    if (!storeId) {
      return NextResponse.json(
        { error: "storeId is required" },
        { status: 400 }
      )
    }


    // ✅ Use find-then-save pattern for reliable updates (NO .lean())
    const store = await Store.findById(storeId)
    
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }


    const now = new Date()
    let action: "checked" | "downgraded" = "checked"
    let wasDowngraded = false

    // ✅ Single source of truth for limits
    const PLAN_LIMITS: Record<string, number | null> = {
      free: 10,
      basic: 20,
      standard: 50,
      premium: null,
    }

    // Check if subscription has expired
    const hasExpired =
      !!store.subscriptionExpiryDate &&
      store.subscriptionExpiryDate < now


    // =====================================
    // DOWNGRADE IF EXPIRED
    // =====================================
    if (hasExpired && store.subscriptionPlan !== "free") {
      
      // ✅ Update all fields via direct assignment
      store.subscriptionPlan = "free"
      store.subscriptionStatus = "expired"
      store.subscriptionExpiryDate = undefined
      store.productLimit = PLAN_LIMITS.free  // ✅ Manually set productLimit
      store.lastPaymentReference = undefined


      // ✅ CRITICAL: Mark fields as modified
      store.markModified('subscriptionPlan')
      store.markModified('subscriptionStatus')
      store.markModified('subscriptionExpiryDate')
      store.markModified('productLimit')
      store.markModified('lastPaymentReference')

      // Save the changes
      await store.save()

      // Small delay to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify the update persisted (without .lean())
      const verification = await Store.findById(storeId).lean()
      

      // Safety check
      if (verification?.productLimit !== PLAN_LIMITS.free) {
        
        // Force update
        await Store.findByIdAndUpdate(
          storeId,
          { 
            $set: { 
              subscriptionPlan: 'free',
              subscriptionStatus: 'expired',
              productLimit: PLAN_LIMITS.free 
            } 
          },
          { new: true }
        )
        
      }

      action = "downgraded"
      wasDowngraded = true
    } else {
      console.log(`\n✅ Subscription is still valid or already on free plan`)
    }

    // =====================================
    // ENFORCE PRODUCT LIMIT
    // =====================================
    const enforcementResult = await enforceProductLimitForStore(store._id)

    return NextResponse.json(
      {
        success: true,
        message: wasDowngraded
          ? "Subscription expired and store downgraded to free plan."
          : "Subscription checked. No downgrade required.",
        action,
        wasDowngraded,
        store: {
          id: store._id,
          name: store.name,
          subscriptionPlan: store.subscriptionPlan,
          subscriptionStatus: store.subscriptionStatus,
          subscriptionExpiryDate: store.subscriptionExpiryDate,
          productLimit: store.productLimit,
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
        details:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    )
  }
}