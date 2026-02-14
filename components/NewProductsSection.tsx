// components/NewProductsSection.tsx (Server Component)

import { Suspense } from "react";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import { NewProductsLoading } from "./NewProductsLoading";
import { NewProductsClient } from "./NewProductsClient";
// import { NewProductsClient } from "./NewProductsClient";
// import { NewProductsLoading } from "./NewProductsLoading";

// Product type
type ProductData = {
  _id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
};

// Fetch new products directly from database
async function getNewProducts(): Promise<ProductData[]> {
  try {
    await connectToDB();

    // Fetch 10 newest products with populated store data
    const products = await Product.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10)
      .populate({
        path: "storeId",
        select: "slug name",
      })
      .lean();

    // Transform to match your Product type
    const transformedProducts = products.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      description: p.description || null,
      price: p.price,
      compare_at_price: p.compareAtPrice || null,
      inventory_quantity: p.inventoryQuantity ?? 0,
      images: (p.images || []).map((img: any) => ({
        id: img._id?.toString() || img.id || "",
        url: img.url || "",
        alt_text: img.altText || img.alt_text || null,
      })),
      store_id: typeof p.storeId === "object" ? p.storeId._id.toString() : p.storeId.toString(),
      store_slug: typeof p.storeId === "object" ? p.storeId.slug : undefined,
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: p.updatedAt || new Date().toISOString(),
    }));

    return transformedProducts;
  } catch (error) {
    console.error("Error fetching new products:", error);
    return [];
  }
}

export default async function NewProductsSection() {
  const products = await getNewProducts();

  return (
    <Suspense fallback={<NewProductsLoading />}>
      <NewProductsClient products={products} />
    </Suspense>
  );
}