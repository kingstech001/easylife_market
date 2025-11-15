import { type NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"

// Helper to update subscription directly in database (no HTTP call)
async function updateSubscription(storeId: string, plan: string, amount: number, reference: string) {
  try {
    await connectToDB()
    
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 1) // 1 month from now

    const updatedStore = await Store.findByIdAndUpdate(
      storeId,
      {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionExpiryDate: expiryDate,
        lastPaymentAmount: amount,
        lastPaymentReference: reference,
        lastPaymentDate: new Date(),
      },
      { new: true }
    ).lean()

    if (!updatedStore) {
      throw new Error("Store not found")
    }

    return {
      success: true,
      store: updatedStore,
      plan,
      expiryDate: expiryDate.toISOString(),
    }
  } catch (error: any) {
    console.error("❌ Failed to update subscription:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, orderData } = body

    if (!reference) {
      return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 })
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No authentication token" }, { status: 401 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    console.log("[v0] Verifying Paystack payment with reference:", reference)

    // Call Paystack API to verify transaction
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData)
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status },
      )
    }

    console.log("[v0] Paystack payment verified:", verifyData)

    if (verifyData.data.status === "success") {
      const paystackMetadata = verifyData.data.metadata ?? {}

      // ✅ HANDLE SUBSCRIPTION PAYMENT
      if (paystackMetadata.type === "subscription") {
        console.log("[v0] Processing subscription payment...")

        const { plan, storeId } = paystackMetadata
        if (!plan || !storeId) {
          return NextResponse.json({ error: "Invalid subscription metadata" }, { status: 400 })
        }

        // ✅ Update seller subscription directly in database
        try {
          const subscriptionResult = await updateSubscription(
            storeId,
            plan,
            verifyData.data.amount / 100,
            reference
          )

          console.log("[v0] Subscription updated successfully:", subscriptionResult)

          return NextResponse.json({
            status: "success",
            message: "Subscription payment verified and updated successfully",
            data: subscriptionResult,
          })
        } catch (error: any) {
          console.error("[v0] Failed to update subscription:", error)
          return NextResponse.json(
            { error: "Payment verified but failed to update subscription", details: error.message },
            { status: 500 },
          )
        }
      }

      // ✅ HANDLE REGULAR CHECKOUT PAYMENT
      const merged = {
        ...paystackMetadata,
        ...(orderData ?? {}),
      }

      // Normalize payment method
      const mapPaymentMethod = (pm?: string, channel?: string) => {
        if (!pm && !channel) return "card"
        const p = (pm || channel || "").toString().toLowerCase()
        if (p === "paystack") return "card"
        if (p === "card" || p === "transfer" || p === "bank" || p === "pos") return p
        return "card"
      }

      const orders = merged.orders
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        console.error("[v0] Invalid orders data:", { ordersData: orders, isArray: Array.isArray(orders) })
        return NextResponse.json({ error: "Invalid orders data. At least one order is required." }, { status: 400 })
      }

      const paymentMethodValue = mapPaymentMethod(merged.paymentMethod, verifyData.data.channel)

      // For checkout orders, we can't use direct fetch, so we'll need to handle this differently
      // Since this is a checkout (not subscription), we should handle order creation separately
      console.log("[v0] Checkout payment verified, but order creation should be handled by checkout flow")
      
      return NextResponse.json({
        status: "success",
        message: "Payment verified successfully",
        data: {
          reference,
          paymentStatus: "success",
          amount: verifyData.data.amount / 100,
          orders: merged.orders,
          shippingInfo: merged.shippingInfo,
        },
      })
    }

    return NextResponse.json({ error: "Payment was not successful" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Missing reference parameter" }, { status: 400 })
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No authentication token" }, { status: 401 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    console.log("[v0] GET: Verifying Paystack payment with reference:", reference)

    // Call Paystack API to verify transaction
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyResponse.ok) {
      console.error("[v0] Paystack verification error:", verifyData)
      return NextResponse.json(
        { error: verifyData.message || "Failed to verify payment" },
        { status: verifyResponse.status },
      )
    }

    console.log("[v0] Paystack payment verified:", verifyData)

    if (verifyData.data.status === "success") {
      const metadata = verifyData.data.metadata ?? {}

      // ✅ HANDLE SUBSCRIPTION FOR GET REQUEST - DIRECT DATABASE UPDATE
      if (metadata.type === "subscription") {
        console.log("[v0] GET: Processing subscription payment...")

        const { plan, storeId } = metadata
        if (!plan || !storeId) {
          return NextResponse.json({ error: "Invalid subscription metadata" }, { status: 400 })
        }

        // ✅ Update seller subscription directly in database
        try {
          const subscriptionResult = await updateSubscription(
            storeId,
            plan,
            verifyData.data.amount / 100,
            reference
          )

          console.log("[v0] Subscription updated successfully:", subscriptionResult)

          return NextResponse.json({
            status: "success",
            message: "Subscription payment verified and updated successfully",
            data: {
              reference,
              plan,
              storeId,
              amount: verifyData.data.amount / 100,
              paymentStatus: "success",
              subscription: subscriptionResult,
            },
          })
        } catch (error: any) {
          console.error("[v0] Failed to update subscription:", error)
          return NextResponse.json(
            { error: "Payment verified but failed to update subscription", details: error.message },
            { status: 500 },
          )
        }
      }

      // ✅ HANDLE CHECKOUT PAYMENT
      if (!metadata.orders || !Array.isArray(metadata.orders) || metadata.orders.length === 0) {
        console.log("[v0] GET verification: Orders not in metadata (likely already verified via POST)")
        return NextResponse.json({
          status: "success",
          message: "Payment verified successfully",
          data: {
            reference,
            paymentStatus: "success",
            amount: verifyData.data.amount,
          },
        })
      }

      // For checkout orders, return success with order data for frontend to handle
      return NextResponse.json({
        status: "success",
        message: "Payment verified successfully",
        data: {
          reference,
          paymentStatus: "success",
          amount: verifyData.data.amount / 100,
          orders: metadata.orders,
          shippingInfo: metadata.shippingInfo,
          paymentMethod: metadata.paymentMethod || "card",
          deliveryFee: metadata.deliveryFee,
        },
      })
    }

    return NextResponse.json({ error: "Payment was not successful" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}