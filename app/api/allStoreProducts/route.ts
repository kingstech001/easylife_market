import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";

export async function GET() {
  try {
    console.log("🔍 Fetching all products from all stores");
    await connectToDB();

    // Ensure Store model is registered by referencing it
    if (!Store) {
      console.error("Store model not found");
    }

    // Fetch all active, non-deleted products with their store information
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    })
      .populate({
        path: "storeId",
        select: "_id name slug", // Include _id for cart functionality
        model: "Store",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log("✅ Products fetched successfully:", products.length);

    // Log sample product for debugging
    if (products.length > 0) {
      console.log("Sample product structure:", {
        name: products[0].name,
        price: products[0].price,
        hasImages: products[0].images?.length > 0,
        imageUrl: products[0].images?.[0]?.url,
        hasStore: !!products[0].storeId,
        storeId: (products[0].storeId as any)?._id,
        storeName: (products[0].storeId as any)?.name,
        storeSlug: (products[0].storeId as any)?.slug,
      });
    }

    // Transform the data to match the expected format
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
            _id: product.storeId._id?.toString() || "", // Include _id for cart
            name: product.storeId.name || "Unknown Store",
            slug: product.storeId.slug || "",
          }
        : null, // Return null instead of undefined for better type safety
      tags: product.tags || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    // Filter out products without valid store data
    const validProducts = formattedProducts.filter((p) => p.storeId !== null);

    console.log("📦 Total formatted products:", formattedProducts.length);
    console.log("✅ Valid products with store data:", validProducts.length);

    if (validProducts.length < formattedProducts.length) {
      console.warn(
        `⚠️ ${formattedProducts.length - validProducts.length} products excluded due to missing store data`
      );
    }

    return NextResponse.json({
      success: true,
      products: validProducts,
      count: validProducts.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all products:", error);
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