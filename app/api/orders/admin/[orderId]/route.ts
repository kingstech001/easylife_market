import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import mongoose from "mongoose"
import { connectToDB } from "@/lib/db"
import Order from "@/models/Order"
import MainOrder from "@/models/MainOrder"

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  if (!token) return false

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const result = await jwtVerify(token, secret)
    return result.payload.role === "admin"
  } catch {
    return false
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID" }, { status: 400 })
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
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await params
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID" }, { status: 400 })
    }

    await connectToDB()

    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    await Order.deleteOne({ _id: orderId })

    const mainOrder = await MainOrder.findOne({ reference: order.reference })
    if (mainOrder) {
      mainOrder.subOrders = mainOrder.subOrders.filter(
        (subOrderId: any) => subOrderId.toString() !== orderId,
      )

      if (mainOrder.subOrders.length === 0) {
        await MainOrder.deleteOne({ _id: mainOrder._id })
      } else {
        const remainingOrders = await Order.find({
          _id: { $in: mainOrder.subOrders },
        }).select("totalPrice")

        mainOrder.totalAmount = remainingOrders.reduce(
          (sum, subOrder) => sum + (Number(subOrder.totalPrice) || 0),
          0,
        )
        mainOrder.grandTotal = mainOrder.totalAmount + (Number(mainOrder.deliveryFee) || 0)
        await mainOrder.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete order" },
      { status: 500 },
    )
  }
}
