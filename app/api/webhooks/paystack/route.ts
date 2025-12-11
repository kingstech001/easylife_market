// app/api/webhooks/paystack/route.ts
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"

// Needed for raw body access in App Router
export const runtime = "nodejs";

function verifyPaystackSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not configured");

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!verifyPaystackSignature(body, signature)) {
      console.error("❌ Invalid Paystack signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    console.log(`📨 Webhook received: ${event.event}`);

    // DB connection once
    await connectToDB();

    switch (event.event) {
      case "charge.success":
        await handleSuccessfulCharge(event.data);
        break;

      case "charge.failed":
        await handleFailedCharge(event.data);
        break;

      case "transfer.success":
      case "transfer.failed":
        console.log(`ℹ️ Transfer event: ${event.event}`, event.data.reference);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ status: "success" });

  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json({ error: error.message });
  }
}

async function handleSuccessfulCharge(data: any) {
  const reference = data.reference;

  console.log(`✅ Processing charge.success: ${reference}`);

  const existingOrders = await Order.find({ reference }).lean();

  if (existingOrders.length > 0) {
    console.log(`ℹ️ Updating existing orders for ${reference}`);

    await Order.updateMany(
      { reference, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          status: "processing",
          paidAt: new Date(data.paid_at || data.transaction_date),
        },
      }
    );

    await MainOrder.updateOne(
      { reference, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          status: "processing",
          paidAt: new Date(data.paid_at || data.transaction_date),
        },
      }
    );
  } else {
    console.log(`ℹ️ No orders found for ${reference}`);
  }

  console.log("Webhook log:", {
    event: "charge.success",
    reference,
    amount: data.amount / 100,
    timestamp: new Date().toISOString(),
  });
}

async function handleFailedCharge(data: any) {
  const reference = data.reference;
  console.log(`❌ Payment failed for ${reference}`);

  await Order.updateMany(
    { reference },
    { $set: { paymentStatus: "failed", status: "cancelled" } }
  );

  await MainOrder.updateOne(
    { reference },
    { $set: { paymentStatus: "failed", status: "cancelled" } }
  );
}
