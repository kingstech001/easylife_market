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

    console.log(`\n${"=".repeat(60)}`)
    console.log(`🔍 CHECKING SUBSCRIPTION FOR STORE: ${storeId}`)
    console.log(`${"=".repeat(60)}`)

    // ✅ Use find-then-save pattern for reliable updates (NO .lean())
    const store = await Store.findById(storeId)
    
    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    console.log(`\n📦 Current Store State:`)
    console.log(`   Plan: ${store.subscriptionPlan}`)
    console.log(`   Status: ${store.subscriptionStatus}`)
    console.log(`   Product Limit: ${store.productLimit}`)
    console.log(`   Expiry Date: ${store.subscriptionExpiryDate}`)

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

    console.log(`\n⏰ Expiry Check:`)
    console.log(`   Has expiry date: ${!!store.subscriptionExpiryDate}`)
    console.log(`   Expiry date: ${store.subscriptionExpiryDate}`)
    console.log(`   Current time: ${now}`)
    console.log(`   Is expired: ${hasExpired}`)

    // =====================================
    // DOWNGRADE IF EXPIRED
    // =====================================
    if (hasExpired && store.subscriptionPlan !== "free") {
      console.log(`\n⚠️  Subscription expired! Downgrading to free plan...`)
      
      // ✅ Update all fields via direct assignment
      store.subscriptionPlan = "free"
      store.subscriptionStatus = "expired"
      store.subscriptionExpiryDate = undefined
      store.productLimit = PLAN_LIMITS.free  // ✅ Manually set productLimit
      store.lastPaymentReference = undefined

      console.log(`\n✏️  New Store State (before save):`)
      console.log(`   New Plan: ${store.subscriptionPlan}`)
      console.log(`   New Status: ${store.subscriptionStatus}`)
      console.log(`   New Limit: ${store.productLimit}`)
      console.log(`   New Expiry: ${store.subscriptionExpiryDate}`)

      // ✅ CRITICAL: Mark fields as modified
      store.markModified('subscriptionPlan')
      store.markModified('subscriptionStatus')
      store.markModified('subscriptionExpiryDate')
      store.markModified('productLimit')
      store.markModified('lastPaymentReference')

      // Save the changes
      await store.save()

      console.log(`💾 Store downgraded and saved`)

      // Small delay to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify the update persisted (without .lean())
      const verification = await Store.findById(storeId).lean()
      
      console.log(`\n🔍 Database Verification:`)
      console.log(`   Verified Plan: ${verification?.subscriptionPlan}`)
      console.log(`   Verified Limit: ${verification?.productLimit}`)
      console.log(`   Verified Status: ${verification?.subscriptionStatus}`)

      // Safety check
      if (verification?.productLimit !== PLAN_LIMITS.free) {
        console.error(`\n❌ WARNING: Product limit mismatch after downgrade!`)
        console.error(`   Expected: ${PLAN_LIMITS.free}`)
        console.error(`   Got: ${verification?.productLimit}`)
        
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
        
        console.log(`🔧 Applied force update`)
      }

      action = "downgraded"
      wasDowngraded = true
    } else {
      console.log(`\n✅ Subscription is still valid or already on free plan`)
    }

    // =====================================
    // ENFORCE PRODUCT LIMIT
    // =====================================
    console.log(`\n🔧 Enforcing product limit...`)
    const enforcementResult = await enforceProductLimitForStore(store._id)

    console.log(`\n✅ Product enforcement complete:`)
    console.log(`   Activated: ${enforcementResult.activated}`)
    console.log(`   Deactivated: ${enforcementResult.deactivated}`)
    console.log(`   Visible: ${enforcementResult.visibleCount}/${enforcementResult.total}`)
    console.log(`${"=".repeat(60)}\n`)

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