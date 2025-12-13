// app/api/webhooks/paystack/route.ts - DEBUG VERSION WITH FULL GET SUPPORT
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import mongoose from "mongoose"
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"

export const runtime = "nodejs"

/**
 * Verify transaction with Paystack API
 */
async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY not configured")
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Paystack verification failed: ${response.statusText}`)
  }

  return await response.json()
}

function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.error("❌ Missing Paystack signature")
    return false
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY not configured")
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex")

  return hash === signature
}

/**
 * GET endpoint - Check payment and order status
 */
export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      )
    }

    const token = request.cookies.get("token")?.value
    const isAuthenticated = !!token

    // Verify payment with Paystack
    const verifyData = await verifyPaystackTransaction(reference)

    if (verifyData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful" },
        { status: 400 }
      )
    }

    const metadata = verifyData.data.metadata ?? {}
    const paidAmount = verifyData.data.amount / 100

    await connectToDB()
    
    // Handle subscription verification
    if (metadata.type === "subscription") {
      const { plan, storeId } = metadata
      
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Invalid subscription metadata" },
          { status: 400 }
        )
      }

      const store = await Store.findById(storeId)
        .select("subscriptionPlan subscriptionStatus lastPaymentReference")
        .lean()

      return NextResponse.json({
        status: "success",
        message: "Subscription payment verified",
        data: {
          reference,
          type: "subscription",
          plan,
          storeId,
          amount: paidAmount,
          paymentStatus: "success",
          subscriptionUpdated: store?.lastPaymentReference === reference,
        },
      })
    }

    // Check if order exists (for checkout payments)
    const existingOrders = await Order.find({ reference })
      .select("_id reference status paymentStatus")
      .lean()
    
    if (existingOrders.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "Payment verified, order being processed",
        data: {
          reference,
          paymentStatus: "success",
          amount: paidAmount,
          orderExists: false,
          metadata,
        },
      })
    }

    if (!isAuthenticated) {
      return NextResponse.json({
        status: "success",
        message: "Payment verified and order created",
        data: {
          reference,
          paymentStatus: "success",
          amount: paidAmount,
          orderExists: true,
          subOrderCount: existingOrders.length,
        },
      })
    }

    const mainOrder = await MainOrder.findOne({
      subOrders: { $in: existingOrders.map((o) => o._id) },
    })
      .select("orderNumber reference status paymentStatus grandTotal createdAt")
      .lean()

    return NextResponse.json({
      status: "success",
      message: "Payment verified and order created",
      data: {
        reference,
        paymentStatus: "success",
        amount: paidAmount,
        orderExists: true,
        orderNumber: mainOrder?.orderNumber,
        status: mainOrder?.status,
        grandTotal: mainOrder?.grandTotal,
        subOrderCount: existingOrders.length,
        createdAt: mainOrder?.createdAt,
      },
    })
  } catch (error: any) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Webhook handler with DEBUG logging
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    console.log("\n" + "=".repeat(80))
    console.log("🔔 WEBHOOK RECEIVED")
    console.log("=".repeat(80))

    // Verify signature
    const isValid = verifyPaystackSignature(body, signature)
    console.log(`Signature Valid: ${isValid ? "✅ YES" : "❌ NO"}`)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    console.log("\n📨 EVENT TYPE:", event.event)
    console.log("\n📦 FULL WEBHOOK DATA:")
    console.log(JSON.stringify(event, null, 2))

    if (event.event === "charge.success") {
      console.log("\n" + "=".repeat(80))
      console.log("💰 CHARGE SUCCESS - DETAILED BREAKDOWN")
      console.log("=".repeat(80))
      
      console.log("\n🔑 REFERENCE:", event.data.reference)
      console.log("💵 AMOUNT:", event.data.amount, "(kobo) =", event.data.amount / 100, "(naira)")
      console.log("🏦 CHANNEL:", event.data.channel)
      console.log("📅 PAID AT:", event.data.paid_at)
      
      console.log("\n📋 METADATA:")
      console.log(JSON.stringify(event.data.metadata, null, 2))
      
      console.log("\n🔍 METADATA ANALYSIS:")
      const metadata = event.data.metadata || {}
      console.log("- Has 'type':", !!metadata.type, "→", metadata.type)
      console.log("- Has 'orders':", !!metadata.orders, "→", Array.isArray(metadata.orders) ? `Array with ${metadata.orders.length} items` : typeof metadata.orders)
      console.log("- Has 'shippingInfo':", !!metadata.shippingInfo, "→", typeof metadata.shippingInfo)
      console.log("- Has 'userId':", !!metadata.userId, "→", metadata.userId)
      console.log("- Has 'deliveryFee':", metadata.deliveryFee !== undefined ? metadata.deliveryFee : "undefined")
      console.log("- Has 'paymentMethod':", !!metadata.paymentMethod, "→", metadata.paymentMethod)
      console.log("- Has 'reference':", !!metadata.reference, "→", metadata.reference)
      
      if (metadata.orders) {
        console.log("\n📦 ORDERS DETAIL:")
        metadata.orders.forEach((order: any, index: number) => {
          console.log(`  Order ${index + 1}:`)
          console.log(`    - storeId: ${order.storeId}`)
          console.log(`    - items: ${order.items?.length || 0} items`)
          if (order.items && order.items.length > 0) {
            order.items.forEach((item: any, i: number) => {
              console.log(`      Item ${i + 1}: productId=${item.productId}, quantity=${item.quantity}`)
            })
          }
        })
      }
      
      if (metadata.shippingInfo) {
        console.log("\n📬 SHIPPING INFO:")
        console.log(`  - firstName: ${metadata.shippingInfo.firstName}`)
        console.log(`  - lastName: ${metadata.shippingInfo.lastName}`)
        console.log(`  - email: ${metadata.shippingInfo.email}`)
        console.log(`  - phone: ${metadata.shippingInfo.phone}`)
        console.log(`  - address: ${metadata.shippingInfo.address}`)
        console.log(`  - state: ${metadata.shippingInfo.state}`)
        console.log(`  - area: ${metadata.shippingInfo.area}`)
      }
      
      console.log("\n⚠️ MISSING FIELDS CHECK:")
      if (!metadata.type) console.log("  ❌ 'type' is MISSING")
      if (!metadata.orders) console.log("  ❌ 'orders' is MISSING")
      if (!metadata.shippingInfo) console.log("  ❌ 'shippingInfo' is MISSING")
      if (!metadata.userId) console.log("  ❌ 'userId' is MISSING")
      
      console.log("\n" + "=".repeat(80))
      console.log("✅ DEBUG COMPLETE - CHECK THE LOGS ABOVE")
      console.log("=".repeat(80) + "\n")
    }

    return NextResponse.json({ status: "success", message: "Debug webhook received" })
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message)
    console.error("Stack:", error.stack)
    return NextResponse.json({ status: "error_logged" })
  }
}