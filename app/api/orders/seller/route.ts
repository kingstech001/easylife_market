// app/api/orders/route.ts (or app/api/seller/orders/route.ts if you separate)
import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import Product from "@/models/Product"
import Store from "@/models/Store"

// ================== JWT Helper ==================
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const result = await jwtVerify(token, secret)
  return result.payload
}

// ================== GET (Seller only) ==================
export async function GET(request: NextRequest) {
  try {
    // 🔑 Get token
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    // 🔑 Verify token
    let payload
    try {
      payload = await verifyToken(token)
    } catch {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    // ✅ Sellers only
    if (payload.role !== "seller") {
      return NextResponse.json({ error: "Only sellers can access this route" }, { status: 403 })
    }

    // 🔑 Connect DB
    await connectToDB()

    // 🔑 Get seller’s store
    const sellerStore = await Store.findOne({ sellerId: payload.id || payload._id }).lean<{ _id: string }>()
    if (!sellerStore) {
      return NextResponse.json({ error: "No store found for this seller" }, { status: 404 })
    }

    // 🔑 Find orders belonging to this seller’s store
    const orders = await Order.find({ storeId: sellerStore._id })
      .populate({
        path: "items.productId",
        model: Product,
        select: "name",
      })
      .sort({ createdAt: -1 })
      .lean()

    // ✅ Format orders for frontend
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: order.totalPrice, // map totalPrice → total
      items: order.items.map((item: any) => ({
        productId: item.productId?._id || item.productId,
        productName: item.productName || item.productId?.name || "Unknown Product",
        quantity: item.quantity,
        price: item.priceAtPurchase,
      })),
    }))

    return NextResponse.json({ orders: formattedOrders }, { status: 200 })
  } catch (error: any) {
    console.error("Seller Orders API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
