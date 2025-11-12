import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      amount,
      plan,
      storeId,
      orders,
      shippingInfo,
      paymentMethod,
      deliveryFee,
      type,
    } = body

    console.log("[Paystack Initialize] Request body:", body)

    // 🧩 Validate common payment fields
    if (!email || !amount) {
      return NextResponse.json(
        { error: "Missing required payment details" },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!paystackSecretKey) {
      console.error("⚠️ PAYSTACK_SECRET_KEY is not set")
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    if (!appUrl) {
      console.error("⚠️ NEXT_PUBLIC_APP_URL is not set")
      return NextResponse.json(
        { error: "App URL not configured" },
        { status: 500 }
      )
    }

    // 💡 Setup Paystack callback + metadata
    let callback_url = ""
    let metadata: Record<string, any> = {}

    if (type === "subscription") {
      // ✅ Handle Seller Subscription Payments
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Missing subscription details" },
          { status: 400 }
        )
      }

      callback_url = `${appUrl}/dashboard/seller/subscriptions/success?plan=${plan}&storeId=${storeId}`
      metadata = { plan, storeId, type: "subscription" }
    } else if (type === "checkout") {
      // 🛒 Handle Regular Checkout Payments
      if (!orders || !shippingInfo) {
        console.error("[Paystack Initialize] Missing checkout details:", {
          hasOrders: !!orders,
          hasShippingInfo: !!shippingInfo,
        })
        return NextResponse.json(
          { error: "Missing checkout details" },
          { status: 400 }
        )
      }

      callback_url = `${appUrl}/payment-success`
      metadata = {
        orders,
        shippingInfo,
        paymentMethod: paymentMethod || "paystack",
        deliveryFee: deliveryFee || 0,
        totalAmount: amount * 100, // Store total in kobo
        type: "checkout",
      }
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      )
    }

    // 🧮 Convert ₦ to Kobo
    const paystackPayload = {
      email,
      amount: amount * 100,
      callback_url,
      metadata,
    }

    console.log("[Paystack Initialize] Payload:", paystackPayload)

    // 🚀 Initialize payment with Paystack
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok) {
      console.error("[Paystack Error]", paystackData)
      return NextResponse.json(
        {
          error: paystackData.message || "Failed to initialize payment",
        },
        { status: paystackResponse.status }
      )
    }

    console.log("[Paystack] Initialized successfully:", paystackData)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[Paystack] Initialization error:", error)
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    )
  }
}