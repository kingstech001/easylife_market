import { type NextRequest, NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/auth"
import { connectToDB } from "@/lib/db"
import Product from "@/models/Product"
import Store from "@/models/Store"
import { calculateMaxDeliveryFee } from "@/lib/delivery-fee"


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

async function verifyAndCalculateOrderAmount(orders: any[], deliveryFee: number = 0) {
  let calculatedTotal = 0
  const verifiedOrders = []

  for (const orderGroup of orders) {
    const { storeId, items } = orderGroup

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error(`Invalid items for store ${storeId}`)
    }

    let storeTotal = 0
    const verifiedItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId).lean()

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.isDeleted) {
        throw new Error(`Product "${product.name}" is no longer available`)
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is currently unavailable`)
      }

      if (product.inventoryQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.inventoryQuantity}`
        )
      }

      const actualPrice = Number(product.price)
      const quantity = Number(item.quantity)
      const itemTotal = actualPrice * quantity

      verifiedItems.push({
        productId: product._id,
        productName: product.name,
        quantity,
        priceAtPurchase: actualPrice,
        itemTotal,
      })

      storeTotal = Number(storeTotal) + Number(itemTotal)
    }

    verifiedOrders.push({
      storeId,
      items: verifiedItems,
      totalPrice: Number(storeTotal),
    })

    calculatedTotal = Number(calculatedTotal) + Number(storeTotal)
  }

  const numericDeliveryFee = Number(deliveryFee) || 0
  const grandTotal = Number(calculatedTotal) + numericDeliveryFee

  return {
    verifiedOrders,
    subtotal: Number(calculatedTotal),
    deliveryFee: numericDeliveryFee,
    grandTotal: Number(grandTotal),
  }
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
        type: "subscription",
        plan: plan,
        storeId: storeId,
        userId: user.id,
        userEmail: user.email,
      }
      
      console.log("[Paystack Initialize] Subscription metadata:", JSON.stringify(metadata, null, 2))
      
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
        type: "checkout",
        orders,
        shippingInfo,
        paymentMethod: paymentMethod || "card",
        deliveryFee: deliveryFee || 0,
        userId: user.id,
        userEmail: user.email,
      }
      
      console.log("[Paystack Initialize] Checkout metadata keys:", Object.keys(metadata))
    }

    // ✅ For checkout payments, calculate server-verified amount
    let finalAmount = Number(amount)
    if (type === "checkout") {
      await connectToDB()

      // Verify delivery fee from coordinates if available
      let verifiedDeliveryFee = Number(deliveryFee) || 0
      const customerCoords = shippingInfo?.customerCoords
      if (customerCoords?.lat && customerCoords?.lng) {
        const storeIds = [...new Set(orders.map((o: any) => o.storeId))].filter(Boolean)
        const stores = await Store.find(
          { _id: { $in: storeIds } },
          { "location.coordinates": 1 }
        ).lean()

        const storesWithCoords = stores.filter(
          (s: any) =>
            s.location?.coordinates?.length === 2 &&
            !(s.location.coordinates[0] === 0 && s.location.coordinates[1] === 0)
        )

        if (storesWithCoords.length > 0) {
          const result = calculateMaxDeliveryFee(
            storesWithCoords.map((s: any) => ({ coordinates: s.location.coordinates })),
            customerCoords.lat,
            customerCoords.lng
          )
          verifiedDeliveryFee = result.fee
          console.log("[Paystack Initialize] Delivery fee verification:", {
            clientFee: deliveryFee,
            verifiedFee: verifiedDeliveryFee,
            distanceKm: result.distanceKm,
          })
        }
      }

      const verifiedOrderData = await verifyAndCalculateOrderAmount(orders, verifiedDeliveryFee)
      finalAmount = verifiedOrderData.grandTotal

      // Update metadata with verified delivery fee
      metadata.deliveryFee = verifiedDeliveryFee

      console.log("[Paystack Initialize] Amount verification:", {
        clientAmount: amount,
        verifiedAmount: finalAmount,
        match: amount === finalAmount
      })
    }

    // ✅ Convert Naira to Kobo (Paystack uses smallest currency unit)
    const amountInKobo = Math.round(finalAmount * 100)
    
    const paystackPayload = {
      email,
      amount: amountInKobo,
      reference: paymentReference,
      callback_url,
      metadata,
    }

    console.log("[Paystack Initialize] Final Payload Summary:", {
      email,
      amount: amountInKobo,
      amountInNaira: finalAmount,
      reference: paymentReference,
      userId: user.id,
      type,
      callback_url,
      metadataKeys: Object.keys(metadata),
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
      type,
    })

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      type,
    })
  } catch (error: any) {
    const message = error?.message || "Failed to initialize payment"
    const isInventoryConflict =
      message.includes("Insufficient stock") ||
      message.includes("no longer available") ||
      message.includes("currently unavailable")

    if (isInventoryConflict) {
      console.warn("[Paystack Initialize] Inventory conflict:", message)
      return NextResponse.json({ error: message }, { status: 409 })
    }
    console.error("[Paystack Initialize] ❌ Unexpected error:", error)
    console.error("Stack trace:", error.stack)
    
    return NextResponse.json(
      { 
        error: "Failed to initialize payment",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    )
  }
}
