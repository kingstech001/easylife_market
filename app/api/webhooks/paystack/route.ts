// app/api/webhooks/paystack/route.ts
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"

/**
 * Paystack Webhook Handler
 * This endpoint receives direct notifications from Paystack when payments are successful
 * More secure than relying solely on client-side verification
 */

function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) {
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
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    if (!verifyPaystackSignature(body, signature)) {
      console.error("❌ Invalid Paystack webhook signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    // Parse the verified body
    const event = JSON.parse(body)

    console.log(`📨 Webhook received: ${event.event}`)

    // Handle different webhook events
    switch (event.event) {
      case "charge.success":
        await handleSuccessfulCharge(event.data)
        break

      case "charge.failed":
        await handleFailedCharge(event.data)
        break

      case "transfer.success":
        console.log("✅ Transfer successful:", event.data.reference)
        break

      case "transfer.failed":
        console.log("❌ Transfer failed:", event.data.reference)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.event}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "success" })
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error)
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ status: "error", message: error.message })
  }
}

async function handleSuccessfulCharge(data: any) {
  try {
    const reference = data.reference
    const amount = data.amount / 100 // Convert from kobo
    const metadata = data.metadata || {}

    console.log(`✅ Processing successful charge: ${reference}`)

    await connectToDB()

    // Check if this is a subscription payment
    if (metadata.type === "subscription") {
      console.log(`📦 Subscription payment detected for store: ${metadata.storeId}`)
      // Subscription is handled by the main verification endpoint
      return
    }

    // Check if orders already exist for this reference
    const existingOrders = await Order.find({ reference }).lean()

    if (existingOrders.length > 0) {
      console.log(`ℹ️ Orders already exist for reference: ${reference}`)
      
      // Update payment status if not already paid
      await Order.updateMany(
        { reference, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "processing",
            paidAt: new Date(data.paid_at || data.transaction_date),
          },
        }
      )

      await MainOrder.updateOne(
        { reference, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "processing",
            paidAt: new Date(data.paid_at || data.transaction_date),
          },
        }
      )

      console.log(`✅ Updated payment status for reference: ${reference}`)
    } else {
      console.log(`ℹ️ No orders found for reference: ${reference} - will be created via API`)
    }

    // Log the webhook for audit trail
    console.log({
      event: "charge.success",
      reference,
      amount,
      channel: data.channel,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error handling successful charge:", error)
    throw error
  }
}

async function handleFailedCharge(data: any) {
  try {
    const reference = data.reference
    console.log(`❌ Payment failed for reference: ${reference}`)

    await connectToDB()

    // Update any existing orders to failed status
    await Order.updateMany(
      { reference },
      {
        $set: {
          paymentStatus: "failed",
          status: "cancelled",
        },
      }
    )

    await MainOrder.updateOne(
      { reference },
      {
        $set: {
          paymentStatus: "failed",
          status: "cancelled",
        },
      }
    )

    console.log(`✅ Updated failed payment status for reference: ${reference}`)
  } catch (error: any) {
    console.error("❌ Error handling failed charge:", error)
    throw error
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}