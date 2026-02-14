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

    // Count products for each store in parallel
    const storesWithProductCount = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({ storeId: store._id });
        return {
          ...store,
          productCount,
        };
      })
    );

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