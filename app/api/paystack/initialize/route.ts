import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orders, shippingInfo, totalAmount, paymentMethod } = body

    if (!shippingInfo?.email || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    const paystackPayload = {
      email: shippingInfo.email,
      amount: totalAmount, // amount already in kobo
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`, // ✅ this line is crucial
      metadata: {
        orders,
        shippingInfo,
        paymentMethod,
      },
    }

    console.log("[v0] Initializing Paystack payment:", paystackPayload)

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackPayload),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("[v0] Paystack error:", paystackData)
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: paystackResponse.status },
      )
    }

    console.log("[v0] Paystack initialized successfully:", paystackData)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
