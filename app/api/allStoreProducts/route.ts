import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 24;

export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // Ensure Store model is registered
    if (!Store) {
      console.error("Store model not found");
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const filter = { isActive: true, isDeleted: false };

    // Run count and fetch in parallel
    const [totalCount, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate({
          path: "storeId",
          select: "_id name slug",
          model: "Store",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const formattedProducts = products.map((product: any) => ({
      _id: product._id?.toString() || "",
      name: product.name || "Unnamed Product",
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || null,
      description: product.description || "",
      inventoryQuantity: product.inventoryQuantity || 0,
      category: product.category || "",
      primaryImage: product.images?.[0]?.url || "",
      images: (product.images || []).map((img: any) => ({
        id: img._id?.toString() || "",
        url: img.url || "",
        alt_text: img.altText || null,
      })),
      storeId: product.storeId
        ? {
            _id: product.storeId._id?.toString() || "",
            name: product.storeId.name || "Unknown Store",
            slug: product.storeId.slug || "",
          }
        : null,
      tags: product.tags || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    const validProducts = formattedProducts.filter((p) => p.storeId !== null);

    return NextResponse.json({
      success: true,
      products: validProducts,
      count: validProducts.length,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
        error: error instanceof Error ? error.message : "Unknown error",
        products: [],
      },
      { status: 500 }
    );
  }
}
