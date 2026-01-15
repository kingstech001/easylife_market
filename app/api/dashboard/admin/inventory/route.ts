// app/api/admin/inventory/route.ts
// Admin endpoint to manually restore inventory for cancelled orders

import { NextRequest, NextResponse } from "next/server"
import { restoreInventoryForOrder } from "@/lib/restoreInventory"
import Order from "@/models/Order"
import { connectToDB } from "@/lib/db"

/**
 * POST - Manually restore inventory for an order
 * Body: { orderId: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, reason } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    console.log(`🔄 Manual inventory restoration requested for order: ${orderId}`)

    const result = await restoreInventoryForOrder(
      orderId,
      reason || "Manual restoration by admin"
    )

    const response = { ...result }
    response.message = result.success
      ? "Inventory restored successfully"
      : "Inventory restoration completed with errors"

    return NextResponse.json(
      response,
      result.success ? {} : { status: 207 }
    )

  } catch (error: any) {
    console.error("❌ Error restoring inventory:", error)
    return NextResponse.json(
      { 
        error: "Failed to restore inventory",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Get inventory status for an order
 * Query: ?orderId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    await connectToDB()

    const order = await Order.findById(orderId)
      .select("reference status paymentStatus items")
      .populate("items.productId", "name inventoryQuantity isActive")
      .lean() as any

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Map items with current inventory status
    const inventoryStatus = order.items.map((item: any) => ({
      productId: item.productId?._id?.toString() || "Unknown",
      productName: item.productName,
      orderedQuantity: item.quantity,
      currentInventory: item.productId?.inventoryQuantity || 0,
      isActive: item.productId?.isActive || false,
      priceAtPurchase: item.priceAtPurchase,
    }))

    return NextResponse.json({
      success: true,
      order: {
        orderId: order._id.toString(),
        reference: order.reference,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      inventoryStatus,
      canRestore: order.status === "cancelled" || order.paymentStatus === "refunded",
    })

  } catch (error: any) {
    console.error("❌ Error getting inventory status:", error)
    return NextResponse.json(
      { 
        error: "Failed to get inventory status",
        details: error.message 
      },
      { status: 500 }
    )
  }
}