import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDB } from "@/lib/db";
import Order from "@/models/Order";
import MainOrder from "@/models/MainOrder";
import Product from "@/models/Product";
import Store from "@/models/Store";
import User from "@/models/User";

async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const result = await jwtVerify(token, secret);
  return result.payload;
}

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const payload = await verifyToken(token);
      if (payload.role !== "admin") {
        return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;
    const status = request.nextUrl.searchParams.get("status") || "all";
    const search = (request.nextUrl.searchParams.get("search") || "").trim();
    const searchQuery: Record<string, any> = {};

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const [matchingUsers, matchingStores] = await Promise.all([
        User.find({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
          ],
        })
          .select("_id")
          .lean(),
        Store.find({ name: searchRegex }).select("_id").lean(),
      ]);

      searchQuery.$or = [
        { reference: searchRegex },
        { "shippingInfo.firstName": searchRegex },
        { "shippingInfo.lastName": searchRegex },
        { "shippingInfo.email": searchRegex },
        { "shippingInfo.phone": searchRegex },
        { "shippingInfo.address": searchRegex },
        { "shippingInfo.area": searchRegex },
        { "shippingInfo.state": searchRegex },
        { "items.productName": searchRegex },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
        { storeId: { $in: matchingStores.map((store) => store._id) } },
      ];
    }

    const query: Record<string, any> = { ...searchQuery };
    if (ORDER_STATUSES.includes(status)) {
      query.status = status;
    }

    const [totalCount, orders, statusCountsResult] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate({
          path: "items.productId",
          model: Product,
          select: "name",
        })
        .populate({
          path: "userId",
          model: User,
          select: "email firstName lastName name",
        })
        .populate({
          path: "storeId",
          model: Store,
          select: "name",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.aggregate([
        { $match: searchQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts = statusCountsResult.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        if (item._id) {
          acc[item._id] = item.count;
          acc.all += item.count;
        }
        return acc;
      },
      { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
    );

    const references = [
      ...new Set(
        orders
          .map((order: any) => order.reference)
          .filter((reference: unknown): reference is string => typeof reference === "string" && reference.length > 0),
      ),
    ];

    const mainOrders = references.length
      ? await MainOrder.find(
          { reference: { $in: references } },
          { reference: 1, totalAmount: 1, deliveryFee: 1, grandTotal: 1, shippingInfo: 1 },
        ).lean()
      : [];

    const mainOrderByReference = new Map(
      mainOrders.map((mainOrder: any) => [mainOrder.reference, mainOrder]),
    );

    const formattedOrders = orders.map((order: any) => {
      const mainOrder = mainOrderByReference.get(order.reference);
      const orderShippingInfo = order.shippingInfo || {};
      const mainOrderShippingInfo = mainOrder?.shippingInfo || {};
      const customerCoords =
        order.customerCoords ||
        orderShippingInfo.customerCoords ||
        mainOrderShippingInfo.customerCoords;
      const shippingInfo = {
        ...mainOrderShippingInfo,
        ...orderShippingInfo,
        ...(customerCoords ? { customerCoords } : {}),
      };

      return {
        ...order,
        customerCoords,
        shippingInfo,
        orderNumber: order.orderNumber || order.reference,
        customerName:
          order.userId?.name ||
          [order.userId?.firstName, order.userId?.lastName].filter(Boolean).join(" ") ||
          shippingInfo?.firstName ||
          "Unknown Customer",
        customerEmail: order.userId?.email || shippingInfo?.email || "No email provided",
        storeName: order.storeId?.name || "Unknown Store",
        subtotal: Number(mainOrder?.totalAmount ?? order.totalPrice) || 0,
        deliveryFee: Number(mainOrder?.deliveryFee) || 0,
        grandTotal: Number(mainOrder?.grandTotal ?? order.totalPrice) || 0,
        items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
          productId: item.productId?._id,
          productName: item.productId?.name || item.productName || "Unknown Product",
          storeName: order.storeId?.name || "Unknown Store",
          quantity: Number(item.quantity) || 0,
          price: Number(item.priceAtPurchase ?? item.price) || 0,
        })),
      };
    });

    return NextResponse.json(
      {
        orders: formattedOrders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
        statusCounts,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Admin Orders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
