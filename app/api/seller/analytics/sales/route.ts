import { type NextRequest, NextResponse } from "next/server";
import getUserFromCookies from "@/lib/getUserFromCookies";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  await connectToDB();
  console.log("DB connected for GET sales analytics.");

  try {
    // 1️⃣ Authenticate user
    const user = await getUserFromCookies(request);
    if (!user) {
      console.log("❌ GET Sales Analytics: User not authenticated.");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Verify store ownership
    const userStore = await Store.findOne({ sellerId: new mongoose.Types.ObjectId(user.id) });
    if (!userStore) {
      console.log(`❌ Store not found for seller ID ${user.id}.`);
      return NextResponse.json({ success: false, message: "Forbidden: Store not found for this user" }, { status: 403 });
    }

    // 3️⃣ Calculate last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // 4️⃣ Aggregate sales per day
    const salesAggregation = await Order.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(userStore._id),
          status: "completed", // Only completed orders count as sales
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+01:00" },
          },
          totalSales: { $sum: "$totalAmount" }, // Replace with your actual order total field
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5️⃣ Fill missing days with 0 sales
    const salesData: { date: string; sales: number }[] = [];
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split("T")[0];
      const existingData = salesAggregation.find((item) => item._id === dateString);
      salesData.push({
        date: dateString,
        sales: existingData ? existingData.totalSales : 0,
      });
    }

    console.log(`✅ Sales Analytics generated for store ${userStore._id}.`);
    return NextResponse.json({ success: true, data: salesData }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching sales analytics:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch sales analytics", error: error.message },
      { status: 500 }
    );
  }
}
