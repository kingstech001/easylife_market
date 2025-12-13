// app/api/webhooks/paystack/route.ts - TEMPORARY DEBUG VERSION
// Replace your current webhook with this to see what Paystack is actually sending

import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export const runtime = "nodejs"

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
      console.log("- Has 'deliveryFee':", !!metadata.deliveryFee, "→", metadata.deliveryFee)
      console.log("- Has 'paymentMethod':", !!metadata.paymentMethod, "→", metadata.paymentMethod)
      
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
        console.log(`  - Name: ${metadata.shippingInfo.firstName} ${metadata.shippingInfo.lastName}`)
        console.log(`  - Email: ${metadata.shippingInfo.email}`)
        console.log(`  - Phone: ${metadata.shippingInfo.phone}`)
        console.log(`  - Address: ${metadata.shippingInfo.address}`)
        console.log(`  - State: ${metadata.shippingInfo.state}`)
        console.log(`  - Area: ${metadata.shippingInfo.area}`)
      }
      
      console.log("\n" + "=".repeat(80))
      console.log("✅ ALL DATA RECEIVED - CHECK THE LOGS ABOVE")
      console.log("=".repeat(80) + "\n")
    }

    return NextResponse.json({ status: "success", message: "Debug webhook - check logs" })
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message)
    console.error("Stack:", error.stack)
    return NextResponse.json({ status: "error_logged" })
  }
}

// Minimal GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: "ok", 
    message: "Webhook endpoint is working",
    timestamp: new Date().toISOString()
  })
}