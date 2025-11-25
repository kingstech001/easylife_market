import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import enforceProductLimit from "@/lib/enforceProductLimit"

const PLAN_DURATIONS: Record<string, number> = {
  free: 0,
  basic: 30,
  standard: 30,
  premium: 30,
}

// Product limits per plan (null = unlimited)
const PRODUCT_LIMITS: Record<string, number | null> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: null, // unlimited
}

/**
 * ✅ POST:
 * Used when the user manually selects a plan (Free or Paid)
 * Includes Paystack verification for paid plans.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, plan, amount, reference } = body

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (amount > 0 && !reference) {
      return NextResponse.json({ error: "Payment reference required for paid plans" }, { status: 400 })
    }

    // ✅ ONLY POST verifies Paystack
    if (amount > 0) {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
      if (!paystackSecretKey) {
        return NextResponse.json({ error: "Payment configuration error" }, { status: 500 })
      }

      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${paystackSecretKey}` },
      })

      if (!verifyResponse.ok) {
        return NextResponse.json({ error: "Failed to verify payment with Paystack" }, { status: 500 })
      }

      const verifyData = await verifyResponse.json()

      if (!verifyData.status || verifyData.data.status !== "success") {
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
      }

      if (verifyData.data.amount !== amount * 100) {
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }
    }

    await connectToDB()

    const startDate = new Date()
    let endDate: Date | null = null

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan]
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + durationDays)
    }

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        lastPaymentReference: reference || null,
        lastPaymentAmount: amount,
      },
      { new: true }
    )

    if (!updatedStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // ✅ ENFORCE PRODUCT LIMIT AFTER PLAN CHANGE
    try {
      const productLimit = PRODUCT_LIMITS[plan]
      const result = await enforceProductLimit(storeId, productLimit)
      console.log(`✅ Enforced product limit for ${plan} plan:`, result)
    } catch (error) {
      console.error("❌ Failed to enforce product limit:", error)
      // Don't fail the entire request, just log the error
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated ${updatedStore.name}'s subscription to ${plan}`,
        plan,
        startDate,
        endDate,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * ✅ PUT:
 * Used by /api/paystack/verify
 * Payment is already verified, so NO NEED to verify Paystack again.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, plan, amount, reference } = body

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    if (!plan || !["free", "basic", "standard", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // ✅ NO Paystack verification here — it was done in verify route.

    await connectToDB()

    const startDate = new Date()
    let endDate: Date | null = null

    if (plan !== "free") {
      const durationDays = PLAN_DURATIONS[plan]
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + durationDays)
    }

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        lastPaymentReference: reference || null,
        lastPaymentAmount: amount,
      },
      { new: true }
    )

    if (!updatedStore) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    // ✅ ENFORCE PRODUCT LIMIT AFTER PLAN CHANGE
    try {
      const productLimit = PRODUCT_LIMITS[plan]
      const result = await enforceProductLimit(storeId, productLimit)
      console.log(`✅ Enforced product limit for ${plan} plan:`, result)
    } catch (error) {
      console.error("❌ Failed to enforce product limit:", error)
      // Don't fail the entire request, just log the error
    }

    return NextResponse.json(
      {
        success: true,
        message: `Subscription updated successfully via Paystack`,
        plan,
        startDate,
        endDate,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Subscription PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
