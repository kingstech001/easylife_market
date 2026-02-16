// components/NewProductsSection.tsx (Server Component)

import { Suspense } from "react";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { NewProductsLoading } from "./NewProductsLoading";
import { NewProductsClient } from "./NewProductsClient";

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
  hasVariants?: boolean;
  variants?: Array<{
    color: {
      name: string;
      hex: string;
      _id?: string;
    };
    sizes: Array<{
      size: string;
      quantity: number;
      _id?: string;
    }>;
    priceAdjustment?: number;
    _id?: string;
  }>;
};

// Helper function to serialize variants (convert ObjectIds to strings)
function serializeVariants(variants: any[]): ProductData['variants'] {
  if (!variants || !Array.isArray(variants)) return undefined;

  return variants.map((variant) => ({
    color: {
      name: variant.color.name,
      hex: variant.color.hex,
      _id: variant.color._id?.toString(), // ✅ Convert ObjectId to string
    },
    sizes: variant.sizes.map((size: any) => ({
      size: size.size,
      quantity: size.quantity,
      _id: size._id?.toString(), // ✅ Convert ObjectId to string
    })),
    priceAdjustment: variant.priceAdjustment || 0,
    _id: variant._id?.toString(), // ✅ Convert ObjectId to string
  }));
}

// Fetch new products directly from database
async function getNewProducts(): Promise<ProductData[]> {
  try {
    await connectToDB();

    // Fetch 10 newest products with populated store data
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({
        path: "storeId",
        select: "slug name",
        model: Store,
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
      hasVariants: p.hasVariants || false,
      variants: serializeVariants(p.variants), // ✅ Serialize variants
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