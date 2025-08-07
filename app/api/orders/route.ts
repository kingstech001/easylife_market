import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function POST(request: NextRequest) {
  try {
    console.log("Orders API: Starting order creation process")

    // Verify authentication
    const token = request.cookies.get("token")?.value
    console.log("Orders API: Token exists:", !!token)

    if (!token) {
      console.log("Orders API: No token provided")
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    console.log("Orders API: JWT_SECRET exists:", !!process.env.JWT_SECRET)

    let payload
    try {
      const result = await jwtVerify(token, secret)
      payload = result.payload
      console.log("Orders API: Token verified successfully, user role:", payload.role)
    } catch (jwtError) {
      console.error("Orders API: JWT verification failed:", jwtError)
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    if (payload.role !== "buyer") {
      console.log("Orders API: User is not a buyer, role:", payload.role)
      return NextResponse.json({ error: "Only buyers can place orders" }, { status: 403 })
    }

    console.log("Orders API: User authorized, processing order data")

    let orderData
    try {
      orderData = await request.json()
      console.log("Orders API: Order data received:", {
        itemCount: orderData.items?.length || 0,
        total: orderData.totals?.total || 0,
        shippingMethod: orderData.shippingMethod,
        paymentMethod: orderData.paymentMethod,
      })
    } catch (parseError) {
      console.error("Orders API: Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Validate order data
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.log("Orders API: Invalid or empty items array")
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    if (!orderData.shippingInfo || !orderData.totals) {
      console.log("Orders API: Missing required order data")
      return NextResponse.json({ error: "Missing required order information" }, { status: 400 })
    }

    // Here you would typically:
    // 1. Validate the order data
    // 2. Save to database
    // 3. Process payment
    // 4. Send confirmation email
    // 5. Update inventory

    // For now, we'll simulate order creation
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Simulate order processing
    const order = {
      id: orderId,
      userId: payload.userId,
      userEmail: payload.email,
      items: orderData.items,
      shippingInfo: orderData.shippingInfo,
      shippingMethod: orderData.shippingMethod,
      paymentMethod: orderData.paymentMethod,
      totals: orderData.totals,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    }

    console.log("Orders API: Order created successfully:", {
      orderId: order.id,
      userId: order.userId,
      itemCount: order.items.length,
      total: order.totals.total,
    })

    return NextResponse.json({
      success: true,
      orderId: orderId,
      message: "Order placed successfully",
      order: {
        id: order.id,
        status: order.status,
        total: order.totals.total,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error("Orders API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
