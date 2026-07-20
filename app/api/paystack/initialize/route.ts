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

async function geocodeAddress(address: string) {
  if (!address.trim()) return null

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "EasyLife Marketplace",
        },
      },
    )

    if (!response.ok) return null

    const results = await response.json()
    const firstResult = Array.isArray(results) ? results[0] : null
    const lat = Number(firstResult?.lat)
    const lng = Number(firstResult?.lon)

    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  } catch (error) {
    console.warn("[Paystack Initialize] Failed to geocode delivery address:", error)
    return null
  }
}

async function getStoreIdsForOrders(orders: any[]) {
  const submittedStoreIds = orders
    .map((order: any) => order.storeId)
    .filter(Boolean)
    .map(String)

  const productIds = orders.flatMap((order: any) =>
    Array.isArray(order.items)
      ? order.items.map((item: any) => item.productId).filter(Boolean)
      : [],
  )

  if (productIds.length === 0) {
    return [...new Set(submittedStoreIds)]
  }

  const products = await Product.find(
    { _id: { $in: productIds } },
    { storeId: 1 },
  ).lean()

  return [
    ...new Set([
      ...submittedStoreIds,
      ...products.map((product: any) => product.storeId?.toString()).filter(Boolean),
    ]),
  ]
}

async function verifyAndCalculateOrderAmount(orders: any[], deliveryFee: number = 0) {
  let calculatedTotal = 0
  const ordersByStore = new Map<string, { items: any[]; totalPrice: number }>()

  for (const orderGroup of orders) {
    const { storeId, items } = orderGroup

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error(`Invalid items for store ${storeId}`)
    }

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
      const resolvedStoreId = String(storeId || (product as any).storeId || "")

      if (!resolvedStoreId) {
        throw new Error(`Store not found for product "${product.name}"`)
      }

      const storeOrder = ordersByStore.get(resolvedStoreId) || {
        items: [],
        totalPrice: 0,
      }

      storeOrder.items.push({
        productId: product._id,
        productName: product.name,
        quantity,
        priceAtPurchase: actualPrice,
        itemTotal,
      })
      storeOrder.totalPrice = Number(storeOrder.totalPrice) + Number(itemTotal)
      ordersByStore.set(resolvedStoreId, storeOrder)

      calculatedTotal = Number(calculatedTotal) + Number(itemTotal)
    }
  }

  const numericDeliveryFee = Number(deliveryFee) || 0
  const grandTotal = Number(calculatedTotal) + numericDeliveryFee

  return {
    verifiedOrders: Array.from(ordersByStore.entries()).map(([storeId, order]) => ({
      storeId,
      items: order.items,
      totalPrice: Number(order.totalPrice),
    })),
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

      // Verify delivery fee from coordinates if available. If the browser did
      // not send a pin, geocode the selected address so the order still saves
      // a usable delivery coordinate for admins.
      let verifiedDeliveryFee = Number(deliveryFee) || 0
      let customerCoords = shippingInfo?.customerCoords
      const hasCustomerCoords =
        Number.isFinite(Number(customerCoords?.lat)) &&
        Number.isFinite(Number(customerCoords?.lng))

      if (!hasCustomerCoords && shippingInfo?.address) {
        customerCoords = await geocodeAddress(
          [shippingInfo.address, shippingInfo.area, shippingInfo.state, "Nigeria"]
            .filter(Boolean)
            .join(", "),
        )
        if (customerCoords) {
          shippingInfo.customerCoords = customerCoords
        }
      }

      if (customerCoords?.lat && customerCoords?.lng) {
        const storeIds = await getStoreIdsForOrders(orders)
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

      // Update metadata with server-verified order groups and delivery fee
      metadata.orders = verifiedOrderData.verifiedOrders
      metadata.shippingInfo = shippingInfo
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
