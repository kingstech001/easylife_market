import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import { enforceProductLimitForStore } from "@/lib/subscriptions/enforceProductLimit"
import { getUserFromCookies } from "@/lib/auth"

const PLAN_DURATIONS: Record<string, number> = {
  free: 0,
  basic: 30,
  standard: 30,
  premium: 30,
}

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: 999999, // Very high number instead of null for unlimited
}

/**
 * ✅ POST: Manual subscription selection (with Paystack verification)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromCookies()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storeId, plan, amount, reference } = body

    console.log("[Subscription POST] Request:", { storeId, plan, amount, reference })

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      )
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (amount > 0 && !reference) {
      return NextResponse.json(
        { error: "Payment reference required for paid plans" },
        { status: 400 }
      )
    }

    // Verify payment with Paystack for paid plans
    if (amount > 0) {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
      if (!paystackSecretKey) {
        return NextResponse.json(
          { error: "Payment configuration error" },
          { status: 500 }
        )
      }

      console.log("[Subscription POST] Verifying payment with Paystack:", reference)

      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        }
      )

      if (!verifyResponse.ok) {
        console.error("[Subscription POST] Paystack verification failed")
        return NextResponse.json(
          { error: "Failed to verify payment with Paystack" },
          { status: 500 }
        )
      }

      const verifyData = await verifyResponse.json()

      if (!verifyData.status || verifyData.data.status !== "success") {
        console.error("[Subscription POST] Payment not successful:", verifyData.data.status)
        return NextResponse.json(
          { error: "Payment verification failed" },
          { status: 400 }
        )
      }

      // Convert amount to kobo for comparison
      const expectedAmountInKobo = amount * 100
      if (verifyData.data.amount !== expectedAmountInKobo) {
        console.error("[Subscription POST] Amount mismatch:", {
          expected: expectedAmountInKobo,
          received: verifyData.data.amount,
        })
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      console.log("[Subscription POST] ✅ Payment verified successfully")
    }

    await connectToDB()

    const startDate = new Date()
    let expiryDate: Date | null = null

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan]
      expiryDate = new Date(startDate)
      expiryDate.setDate(startDate.getDate() + durationDays)
    }

    // Get the correct product limit
    const productLimit = PLAN_LIMITS[plan]

    console.log(`[Subscription POST] Updating subscription:`)
    console.log(`   Store: ${storeId}`)
    console.log(`   Plan: ${plan}`)
    console.log(`   Product Limit: ${productLimit}`)
    console.log(`   Expiry Date: ${expiryDate?.toISOString() || 'N/A'}`)

    // Update store subscription
    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionStartDate: startDate,
        subscriptionExpiryDate: expiryDate,
        productLimit: productLimit,
        lastPaymentReference: reference || null,
        lastPaymentAmount: amount,
        lastPaymentDate: amount > 0 ? new Date() : undefined,
      },
      { new: true }
    )

    if (!updatedStore) {
      console.error("[Subscription POST] Store not found:", storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    console.log(`[Subscription POST] ✅ Store updated successfully`)

    // Enforce product limit
    const productResult = await enforceProductLimitForStore(storeId)

    console.log(`[Subscription POST] ✅ Product limit enforced:`, {
      activated: productResult.activated,
      deactivated: productResult.deactivated,
      visibleCount: productResult.visibleCount,
      total: productResult.total,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated subscription to ${plan}`,
        data: {
          plan: updatedStore.subscriptionPlan,
          status: updatedStore.subscriptionStatus,
          productLimit: updatedStore.productLimit,
          startDate: updatedStore.subscriptionStartDate,
          expiryDate: updatedStore.subscriptionExpiryDate,
          products: {
            activated: productResult.activated,
            deactivated: productResult.deactivated,
            visible: productResult.visibleCount,
            total: productResult.total,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[Subscription POST] Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * ✅ PUT: Called by webhook/verify after payment verification
 * Payment already verified, so no Paystack check needed
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, plan, amount, reference } = body

    console.log("[Subscription PUT] Request:", { storeId, plan, amount, reference })

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      )
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    await connectToDB()

    // Check if already processed (with proper null check)
    if (reference) {
      const existingStore = await Store.findById(storeId)
        .select("lastPaymentReference subscriptionPlan subscriptionStatus productLimit subscriptionExpiryDate")
        .lean()
      
      if (existingStore && existingStore.lastPaymentReference === reference) {
        console.log("[Subscription PUT] Already processed, returning existing data")
        
        return NextResponse.json({
          success: true,
          message: "Subscription already updated",
          data: {
            plan: existingStore.subscriptionPlan,
            status: existingStore.subscriptionStatus,
            productLimit: existingStore.productLimit,
            expiryDate: existingStore.subscriptionExpiryDate,
          },
        })
      }
    }

    const startDate = new Date()
    let expiryDate: Date | null = null

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan]
      expiryDate = new Date(startDate)
      expiryDate.setDate(startDate.getDate() + durationDays)
    }

    // Get the correct product limit
    const productLimit = PLAN_LIMITS[plan]

    console.log(`[Subscription PUT] Updating subscription:`)
    console.log(`   Store: ${storeId}`)
    console.log(`   Plan: ${plan}`)
    console.log(`   Product Limit: ${productLimit}`)
    console.log(`   Expiry Date: ${expiryDate?.toISOString() || 'N/A'}`)

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        $set: {
          subscriptionPlan: plan,
          subscriptionStatus: "active",
          subscriptionStartDate: startDate,
          subscriptionExpiryDate: expiryDate,
          productLimit: productLimit,
          lastPaymentReference: reference ?? null,
          lastPaymentAmount: amount ?? 0,
          lastPaymentDate: new Date(),
        },
      },
      { new: true }
    )

    if (!updatedStore) {
      console.error(`[Subscription PUT] ❌ Store ${storeId} not found!`)
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    console.log(`[Subscription PUT] Store updated:`, {
      plan: updatedStore.subscriptionPlan,
      productLimit: updatedStore.productLimit,
      status: updatedStore.subscriptionStatus,
    })

    // Verify the update took effect
    await new Promise((resolve) => setTimeout(resolve, 100))
    const freshStore = await Store.findById(storeId)
      .select("subscriptionPlan productLimit subscriptionStatus subscriptionExpiryDate")
      .lean()

    if (freshStore) {
      console.log(`[Subscription PUT] Fresh store data:`, {
        plan: freshStore.subscriptionPlan,
        productLimit: freshStore.productLimit,
        status: freshStore.subscriptionStatus,
      })

      // If STILL wrong, force fix with direct MongoDB update
      if (freshStore.productLimit !== productLimit) {
        console.warn(`[Subscription PUT] ⚠️ Product limit mismatch! Expected: ${productLimit}, Got: ${freshStore.productLimit}`)
        console.log(`[Subscription PUT] Applying direct MongoDB fix...`)

        const mongoose = (await import("mongoose")).default
        await mongoose.connection.collection("stores").updateOne(
          { _id: new mongoose.Types.ObjectId(storeId) },
          {
            $set: {
              productLimit: Number(productLimit),
              subscriptionPlan: plan,
              updatedAt: new Date(),
            },
          }
        )

        console.log(`[Subscription PUT] 🔧 Applied direct MongoDB update`)

        // Final verification
        const finalCheck = await Store.findById(storeId)
          .select("productLimit subscriptionPlan")
          .lean()
        
        if (finalCheck) {
          console.log(`[Subscription PUT] Final verification:`, {
            plan: finalCheck.subscriptionPlan,
            productLimit: finalCheck.productLimit,
          })
        }
      }
    }

    // Enforce product limit
    const productResult = await enforceProductLimitForStore(storeId)

    console.log(`[Subscription PUT] ✅ Product limit enforced:`, {
      activated: productResult.activated,
      deactivated: productResult.deactivated,
      visibleCount: productResult.visibleCount,
      total: productResult.total,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Subscription updated successfully`,
        data: {
          plan: updatedStore.subscriptionPlan,
          status: updatedStore.subscriptionStatus,
          productLimit: updatedStore.productLimit,
          startDate: updatedStore.subscriptionStartDate,
          expiryDate: updatedStore.subscriptionExpiryDate,
          products: {
            activated: productResult.activated,
            deactivated: productResult.deactivated,
            visible: productResult.visibleCount,
            total: productResult.total,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[Subscription PUT] ❌ Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * ✅ GET: Get current subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromCookies()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const storeId = request.nextUrl.searchParams.get("storeId")

    await connectToDB()

    if (!storeId || storeId === "current") {
      // Get user's store
      const store = await Store.findOne({ userId: user.id })
        .select("_id subscriptionPlan subscriptionStatus productLimit subscriptionExpiryDate")
        .lean()

      if (!store) {
        return NextResponse.json(
          { error: "Store not found" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          storeId: store._id.toString(),
          plan: store.subscriptionPlan || "free",
          status: store.subscriptionStatus || "active",
          productLimit: store.productLimit || 10,
          expiryDate: store.subscriptionExpiryDate,
          email: user.email,
        },
      })
    }

    // Get specific store
    const store = await Store.findById(storeId)
      .select("_id subscriptionPlan subscriptionStatus productLimit subscriptionExpiryDate userId")
      .lean()

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      )
    }

    // Verify user owns this store (with proper type checking)
    const storeUserId = (store as any).userId?.toString()
    if (storeUserId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this store" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        storeId: store._id.toString(),
        plan: store.subscriptionPlan || "free",
        status: store.subscriptionStatus || "active",
        productLimit: store.productLimit || 10,
        expiryDate: store.subscriptionExpiryDate,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("[Subscription GET] Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    )
  }
}