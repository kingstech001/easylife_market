import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder" // ✅ ADD THIS

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    
    const signature = req.headers.get("x-paystack-signature")
    const secret = process.env.PAYSTACK_SECRET_KEY
    
    if (!secret) {
      console.error("❌ PAYSTACK_SECRET_KEY not set")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    if (!signature) {
      console.error("❌ No signature header found")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const hash = crypto.createHmac("sha512", secret).update(bodyText).digest("hex")
    
    if (hash !== signature) {
      console.error("❌ Invalid Paystack signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    console.log("✅ Signature verified successfully")

    const event = JSON.parse(bodyText)
    
    console.log("📦 Webhook event received:", {
      event: event.event,
      reference: event.data?.reference,
      status: event.data?.status,
    })

    await connectToDB()

    switch (event.event) {
      case "charge.success": {
        const { reference, amount, customer, paid_at } = event.data
        
        console.log("✅ Payment successful:", {
          reference,
          amount: amount / 100,
          customer: customer.email,
          paidAt: paid_at,
        })

        // Update all sub-orders
        const orders = await Order.find({ reference })
        
        if (orders.length === 0) {
          console.error("❌ Orders not found for reference:", reference)
          return NextResponse.json({ 
            status: "ok", 
            message: "Orders not found" 
          }, { status: 200 })
        }

        for (const order of orders) {
          order.paymentStatus = "paid"
          order.status = "processing"
          order.paidAt = new Date(paid_at)
          order.paymentDetails = {
            transactionId: event.data.id,
            amount: amount / 100,
            currency: event.data.currency,
            channel: event.data.channel,
            fees: event.data.fees / 100,
            paidAt: new Date(paid_at),
          }
          
          await order.save()
          console.log("✅ Order updated successfully:", order._id)
        }

        // ✅ UPDATE MAINORDER TOO
        const mainOrder = await MainOrder.findOne({ reference })
        if (mainOrder) {
          mainOrder.paymentStatus = "paid"
          mainOrder.status = "processing"
          mainOrder.paidAt = new Date(paid_at)
          mainOrder.paymentDetails = {
            transactionId: event.data.id,
            amount: amount / 100,
            currency: event.data.currency,
            channel: event.data.channel,
            fees: event.data.fees / 100,
            paidAt: new Date(paid_at),
          }
          await mainOrder.save()
          console.log("✅ MainOrder updated successfully:", mainOrder._id)
        }
        
        break
      }

      case "charge.failed":
      case "invoice.payment_failed": {
        const { reference, customer } = event.data
        
        console.log("❌ Payment failed:", {
          reference,
          customer: customer?.email,
        })

        // Update sub-orders
        const orders = await Order.find({ reference })
        
        for (const order of orders) {
          order.paymentStatus = "failed"
          order.status = "cancelled"
          await order.save()
          
          console.log("✅ Order marked as failed:", order._id)
        }

        // ✅ UPDATE MAINORDER TOO
        const mainOrder = await MainOrder.findOne({ reference })
        if (mainOrder) {
          mainOrder.paymentStatus = "failed"
          mainOrder.status = "cancelled"
          await mainOrder.save()
          console.log("✅ MainOrder marked as failed:", mainOrder._id)
        }
        
        break
      }

      case "transfer.success": {
        console.log("✅ Transfer successful:", event.data.reference)
        break
      }

      case "transfer.failed": {
        console.log("❌ Transfer failed:", event.data.reference)
        break
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.event)
    }

    return NextResponse.json({ 
      status: "success",
      message: "Webhook processed" 
    }, { status: 200 })

  } catch (err: any) {
    console.error("❌ Webhook error:", err)
    
    return NextResponse.json({ 
      status: "error", 
      message: "Webhook processing failed" 
    }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Paystack webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}