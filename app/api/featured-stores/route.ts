// app/api/featured-stores/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import type { ApiResponse } from "@/app/types/api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    await connectToDB();

    // Fetch only 4 published and approved stores - limit at database level
    const stores = await Store.find({ isPublished: true, isApproved: true })
      .sort({ createdAt: -1 })
      .limit(4) // Limit in database, not on client
      .lean(); // Use lean() for better performance

    // One aggregation counts the products for ALL of these stores at once
    // (previously: one countDocuments query per store)
    const storeIds = stores.map((store) => store._id);
    const counts =
      storeIds.length > 0
        ? await Product.aggregate([
            {
              $match: {
                storeId: { $in: storeIds },
                isActive: true,
                isDeleted: false,
                inventoryQuantity: { $gt: 0 },
              },
            },
            { $group: { _id: "$storeId", count: { $sum: 1 } } },
          ])
        : [];

    const countByStoreId = new Map<string, number>(
      counts.map((row: { _id: unknown; count: number }) => [
        String(row._id),
        row.count,
      ]),
    );

    // Stores with no matching products get productCount: 0
    const storesWithProductCount = stores.map((store) => ({
      ...store,
      productCount: countByStoreId.get(String(store._id)) ?? 0,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Featured stores fetched successfully",
        stores: storesWithProductCount,
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      },
    );
  } catch (error: any) {
    console.error("Error fetching featured stores:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch featured stores",
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}