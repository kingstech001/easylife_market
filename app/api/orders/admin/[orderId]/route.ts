import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"

// ✅ PATCH — update order status
export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
  try {
    // Await params destructuring (important for dynamic routes)
    const { orderId } = await params

    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 })
    }

    await connectToDB()

    const order = await Order.findById(orderId)

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    order.status = status
    await order.save()

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update order status" },
      { status: 500 }
    )
  }
}
