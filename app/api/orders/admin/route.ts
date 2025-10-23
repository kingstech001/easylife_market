import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Store from "@/models/Store";
import User from "@/models/User";
import { jwtVerify } from "jose";

// Helper: Verify JWT
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const result = await jwtVerify(token, secret);
  return result.payload;
}

// ================== ADMIN GET ==================
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
      if (payload.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - Admins only" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    // 🟢 Populate product → store and user
    const orders = await Order.find({})
      .populate({
        path: "items.productId",
        model: Product,
        select: "name storeId",
        populate: {
          path: "storeId",
          model: Store,
          select: "name", // ✅ Use 'name' instead of 'storeName'
        },
      })
      .populate({
        path: "userId",
        model: User,
        select: "email name",
      })
      .sort({ createdAt: -1 })
      .lean();

    // 🧩 Format response for frontend
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      customerName:
        order.userId?.name ||
        order.shippingInfo?.firstName ||
        "Unknown Customer",
      customerEmail: order.userId?.email || "No email provided",
      storeName: order.items[0]?.productId?.storeId?.name || "Unknown Store",
      items: order.items.map((item: any) => ({
        productId: item.productId?._id,
        productName: item.productId?.name || "Unknown Product",
        storeName: item.productId?.storeId?.name || "Unknown Store",
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (error: any) {
    console.error("Admin Orders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
