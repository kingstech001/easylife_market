import { type NextRequest, NextResponse } from "next/server";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Store from "@/models/Store";
import getUserFromCookies from "@/lib/getUserFromCookies";
import { connectToDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET(request: Request) {
  await connectToDB();

  try {
    const user = await getUserFromCookies(request as NextRequest);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userStore = await Store.findOne({
      sellerId: new mongoose.Types.ObjectId(user.id),
    });
    if (!userStore) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Store not found for this user" },
        { status: 403 }
      );
    }

    const storeId = userStore._id;

    // Fetch total products
    const productsCount = await Product.countDocuments({ storeId });

    // Aggregate sales, orders, and unique customers
    const salesAggregation = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } }, // match all orders for this store
      {
        $facet: {
          // 1️⃣ Total Sales (only completed)
          sales: [
            { $match: { status: "delivered" } },
            { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
          ],

          // 2️⃣ Orders Count + Unique Customers (all orders)
          ordersAndCustomers: [
            {
              $group: {
                _id: null,
                ordersCount: { $sum: 1 },
                uniqueCustomers: { $addToSet: "$userId" },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalSales: {
            $ifNull: [{ $arrayElemAt: ["$sales.totalSales", 0] }, 0],
          },
          ordersCount: {
            $ifNull: [
              { $arrayElemAt: ["$ordersAndCustomers.ordersCount", 0] },
              0,
            ],
          },
          customersCount: {
            $size: {
              $ifNull: [
                { $arrayElemAt: ["$ordersAndCustomers.uniqueCustomers", 0] },
                [],
              ],
            },
          },
        },
      },
    ]);

    const stats = salesAggregation[0] || {
      totalSales: 0,
      ordersCount: 0,
      customersCount: 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          totalSales: stats.totalSales,
          ordersCount: stats.ordersCount,
          customersCount: stats.customersCount,
          productsCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch dashboard stats",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
