import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"
import Product from "@/models/Product"
import Store from "@/models/Store" // ← Add this import

// ================== JWT Helper ==================
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const result = await jwtVerify(token, secret)
  return result.payload
}

// ================== Helper: Extract token from cookies or Authorization header ==================
function getTokenFromRequest(request: NextRequest): string | null {
  // Check cookies first
  const cookieToken = request.cookies.get("token")?.value
  if (cookieToken) {
    console.log("✅ Token found in cookies")
    return cookieToken
  }

  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    console.log("✅ Token found in Authorization header")
    return authHeader.slice(7)
  }

  // Debug: Log all cookies to see what's available
  console.log("❌ No token found. Available cookies:", 
    Array.from(request.cookies.getAll()).map(c => c.name).join(", "))
  
  return null
}

// ================== POST - Create Main Order with Sub-Orders ==================
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      console.error("❌ POST /api/orders/buyer - No token provided")
      return NextResponse.json(
        { 
          error: "Unauthorized - No token provided",
          debug: "Please make sure you're logged in" 
        }, 
        { status: 401 }
      )
    }

    let payload
    try {
      payload = await verifyToken(token)
    } catch (error) {
      console.error("❌ POST /api/orders/buyer - Invalid token:", error)
      return NextResponse.json(
        { 
          error: "Unauthorized - Invalid token",
          debug: "Token verification failed. Please log in again." 
        }, 
        { status: 401 }
      )
    }

    if (payload.role !== "buyer") {
      return NextResponse.json({ error: "Only buyers can place orders" }, { status: 403 })
    }

    const requestData = await request.json()
    console.log("[v0] Request data received:", JSON.stringify(requestData, null, 2))

    const { orders: ordersData, deliveryFee, shippingInfo, paymentMethod, receiptUrl } = requestData

    if (!ordersData || !Array.isArray(ordersData) || ordersData.length === 0) {
      console.log("[v0] Invalid orders data:", {
        ordersData,
        isArray: Array.isArray(ordersData),
      })
      return NextResponse.json({ error: "At least one order must be provided" }, { status: 400 })
    }

    for (const orderData of ordersData) {
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        console.log("[v0] Invalid items in order:", orderData)
        return NextResponse.json({ error: "Each order must contain at least one item" }, { status: 400 })
      }
      if (!orderData.storeId) {
        console.log("[v0] Missing storeId in order:", orderData)
        return NextResponse.json({ error: "Each order must include a storeId" }, { status: 400 })
      }
    }

    await connectToDB()

    const createdSubOrders = []
    let totalAmount = 0

    for (const orderData of ordersData) {
      const enrichedItems = await Promise.all(
        orderData.items.map(async (item: any) => {
          const product = await Product.findById(item.productId).select("name")
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`)
          }
          return {
            productId: item.productId,
            productName: item.productName || product.name,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          }
        }),
      )

      const subOrder = await Order.create({
        storeId: orderData.storeId,
        userId: payload.id || payload._id,
        totalPrice: orderData.totalPrice,
        status: "pending",
        items: enrichedItems,
        paymentMethod,
        receiptUrl,
        shippingInfo,
      })

      createdSubOrders.push(subOrder)
      totalAmount += orderData.totalPrice
    }

    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    const orderNumber = `ORD-${timestamp}${random}`

    const mainOrder = await MainOrder.create({
      userId: payload.id || payload._id,
      orderNumber,
      subOrders: createdSubOrders.map((order) => order._id),
      totalAmount,
      deliveryFee: deliveryFee || 0,
      grandTotal: totalAmount + (deliveryFee || 0),
      shippingInfo,
      paymentMethod,
      receiptUrl,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      mainOrder: {
        ...mainOrder.toObject(),
        subOrders: createdSubOrders,
      },
    })
  } catch (error: any) {
    console.error("❌ POST /api/orders/buyer error:", error.message || error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// ================== GET - Fetch Main Orders with Sub-Orders ==================
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/orders/buyer - Request received")
    
    const token = getTokenFromRequest(request)
    if (!token) {
      console.error("❌ GET /api/orders/buyer - No token provided")
      return NextResponse.json(
        { 
          error: "Unauthorized - No token provided",
          debug: "Please make sure you're logged in. Check if cookies are being sent." 
        }, 
        { status: 401 }
      )
    }

    let payload
    try {
      payload = await verifyToken(token)
      console.log("✅ Token verified for user:", payload.id || payload._id)
    } catch (error) {
      console.error("❌ GET /api/orders/buyer - Invalid token:", error)
      return NextResponse.json(
        { 
          error: "Unauthorized - Invalid token",
          debug: "Token verification failed. Please log in again." 
        }, 
        { status: 401 }
      )
    }

    if (payload.role !== "buyer") {
      console.error("❌ GET /api/orders/buyer - User is not a buyer")
      return NextResponse.json({ error: "Only buyers can fetch their orders" }, { status: 403 })
    }

    await connectToDB()
    console.log("✅ Database connected")

    const mainOrders = await MainOrder.find({
      userId: payload.id || payload._id,
    })
      .populate({
        path: "subOrders",
        populate: [
          {
            path: "items.productId",
            model: Product,
            select: "name",
          },
          {
            path: "storeId",
            model: Store, // ← Explicitly specify the model
            select: "name",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()

    console.log("✅ Found", mainOrders.length, "orders for user")

    mainOrders.forEach((order: any) => {
      order.subOrders.forEach((subOrder: any) => {
        subOrder.storeName = subOrder.storeId?.name || "Unknown Store"
      })
    })

    return NextResponse.json({ orders: mainOrders }, { status: 200 })
  } catch (error: any) {
    console.error("❌ GET /api/orders/buyer error:", error.message || error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    )
  }
}