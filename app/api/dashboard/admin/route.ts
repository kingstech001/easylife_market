import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Visit from "@/models/Visit";
import Order from "@/models/Order";
import { verifyUserRole } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDB();

    // ✅ 1. Verify user is authenticated and is an admin
    const user = await verifyUserRole("admin");

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    console.log("✅ Admin user authenticated:", user.email);

    // ✅ 2. Fetch dashboard data
    const totalStores = await Store.countDocuments();
    const totalVisits = await Visit.countDocuments();

    // Count only delivered orders
    const totalSales = await Order.countDocuments({ status: "delivered" });

    // Revenue only from delivered orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // ✅ 3. Calculate changes for percentage metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Visits in last 30 days
    const recentVisits = await Visit.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Visits in previous 30 days (30-60 days ago)
    const previousVisits = await Visit.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate percentage change for visits
    const visitsChange =
      previousVisits > 0
        ? Math.round(((recentVisits - previousVisits) / previousVisits) * 100)
        : 0;

    // Sales in last 30 days
    const recentSales = await Order.countDocuments({
      status: "delivered",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Sales in previous 30 days
    const previousSales = await Order.countDocuments({
      status: "delivered",
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate percentage change for sales
    const salesChange =
      previousSales > 0
        ? Math.round(((recentSales - previousSales) / previousSales) * 100)
        : 0;

    console.log("✅ Dashboard data loaded successfully");

    return NextResponse.json({
      totalStores,
      totalVisits,
      totalSales,
      totalRevenue,
      visitsChange,
      salesChange,
    });
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}