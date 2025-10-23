import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"
import Product from "@/models/Product"

// ================== JWT Helper ==================
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const result = await jwtVerify(token, secret)
  return result.payload
}

// ================== Helper: Extract token from cookies or Authorization header ==================
function getTokenFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("token")?.value
  if (cookieToken) return cookieToken

  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  return null
}

// ================== POST - Create Main Order with Sub-Orders ==================
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
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
    console.error("Buyer Orders API POST error:", error.message || error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// ================== GET - Fetch Main Orders with Sub-Orders ==================
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    if (payload.role !== "buyer") {
      return NextResponse.json({ error: "Only buyers can fetch their orders" }, { status: 403 })
    }

    await connectToDB()

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
            select: "name",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()

    mainOrders.forEach((order: any) => {
      order.subOrders.forEach((subOrder: any) => {
        subOrder.storeName = subOrder.storeId?.name || "Unknown Store"
      })
    })

    return NextResponse.json({ orders: mainOrders }, { status: 200 })
  } catch (error: any) {
    console.error("Buyer Orders API GET error:", error.message || error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
