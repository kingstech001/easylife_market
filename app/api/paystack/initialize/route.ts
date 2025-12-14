import { type NextRequest, NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/auth"


// Helper to get the correct base URL for all environments
function getBaseUrl() {
  // Production on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Custom production domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Local development fallback
  return "http://localhost:3000"
}

// Generate unique payment reference
function generateReference() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `REF_${timestamp}_${random}`.toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Get authenticated user from JWT cookie
    const user = await getUserFromCookies()
    if (!user) {
      console.error("[Paystack Initialize] Unauthorized: No valid user session")
      return NextResponse.json(
        { error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      )
    }

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
      reference, // Allow custom reference or generate one
    } = body

    // ✅ Validate common payment fields
    if (!email || !amount) {
      console.error("[Paystack Initialize] Missing required fields:", { email: !!email, amount: !!amount })
      return NextResponse.json(
        { error: "Missing required payment details" },
        { status: 400 }
      )
    }

    if (!type || (type !== "subscription" && type !== "checkout")) {
      console.error("[Paystack Initialize] Invalid payment type:", type)
      return NextResponse.json(
        { error: "Invalid payment type. Must be 'subscription' or 'checkout'" },
        { status: 400 }
      )
    }

    // ✅ Check environment variables
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("❌ PAYSTACK_SECRET_KEY is not set in environment variables")
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      )
    }

    // ✅ Generate or use provided reference
    const paymentReference = reference || generateReference()
    console.log("[Paystack Initialize] Using reference:", paymentReference)

    // ✅ Get base URL (works in all environments)
    const baseUrl = getBaseUrl()

    // ✅ Setup Paystack callback + metadata based on payment type
    let callback_url = ""
    let metadata: Record<string, any> = {}

    if (type === "subscription") {
      // 💳 Handle Seller Subscription Payments
      if (!plan || !storeId) {
        return NextResponse.json(
          { error: "Missing subscription details (plan or storeId)" },
          { status: 400 }
        )
      }

      callback_url = `${baseUrl}/dashboard/seller/subscriptions/success?plan=${plan}&storeId=${storeId}`
      metadata = { 
        plan, 
        storeId,
        userId: user.id, // ✅ Include authenticated user ID
        userEmail: user.email, // ✅ Include user email for verification
        type: "subscription",
        reference: paymentReference, // ✅ Include reference in metadata
        callback_url: `${baseUrl}/dashboard/seller/subscriptions/success`
      }
      
    } else if (type === "checkout") {
      // 🛒 Handle Regular Checkout Payments
      if (!orders || !Array.isArray(orders) || orders.length === 0) {
        return NextResponse.json(
          { error: "Invalid orders data. At least one order is required." },
          { status: 400 }
        )
      }

      if (!shippingInfo) {
        return NextResponse.json(
          { error: "Shipping information is required" },
          { status: 400 }
        )
      }

      callback_url = `${baseUrl}/checkout/payment-success`
      metadata = {
        orders,
        shippingInfo,
        paymentMethod: paymentMethod || "card",
        deliveryFee: deliveryFee || 0,
        userId: user.id, // ✅ Include authenticated user ID
        userEmail: user.email, // ✅ Include user email for verification
        type: "checkout",
        reference: paymentReference, // ✅ Include reference in metadata
      }
    }

    // ✅ Convert Naira to Kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(amount * 100)
    
    const paystackPayload = {
      email,
      amount: amountInKobo,
      reference: paymentReference, // ✅ Set custom reference
      callback_url,
      metadata,
    }

    console.log("[Paystack Initialize] Payload:", {
      email,
      amount: amountInKobo,
      reference: paymentReference,
      userId: user.id,
      type,
      callback_url,
    })

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
      console.error("[Paystack Initialize] Error response:", {
        status: paystackResponse.status,
        message: paystackData.message,
        data: paystackData,
      })
      return NextResponse.json(
        {
          error: paystackData.message || "Failed to initialize payment",
          details: process.env.NODE_ENV === "development" ? paystackData : undefined,
        },
        { status: paystackResponse.status }
      )
    }

    console.log("[Paystack Initialize] ✅ Success:", {
      reference: paystackData.data.reference,
      authorization_url: paystackData.data.authorization_url,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference, // This will be our custom reference
      type,
    })
  } catch (error: any) {
    console.error("[Paystack Initialize] ❌ Unexpected error:", error)
    console.error("Stack trace:", error.stack)
    
    return NextResponse.json(
      { 
        error: "Failed to initialize payment",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}