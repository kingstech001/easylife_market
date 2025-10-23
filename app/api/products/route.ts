import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";

export async function GET(req: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Search by name
    if (searchParams.get("search")) {
      filter.name = {
        $regex: searchParams.get("search"),
        $options: "i",
      };
    }

    // Filter by status
    if (searchParams.get("status")) {
      const status = searchParams.get("status");
      if (status === "active") {
        filter.isActive = true;
      } else if (status === "archived") {
        filter.isActive = false;
      }
    }

    // Filter by category
    if (searchParams.get("category")) {
      filter.category = searchParams.get("category");
    }

    // Fetch products
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Transform data for frontend
    const transformedProducts = products.map((p) => ({
      ...p,
      inventory: p.inventoryQuantity ?? 0,
      status: p.isActive ? "active" : "archived",
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
