import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import AllStoreProductsClient from "./AllStoreProductsClient";

type TransformedProduct = {
  id: string;
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

async function getProducts(): Promise<TransformedProduct[]> {
  try {
    await connectToDB();

    // Ensure Store model is registered
    if (!Store) {
      console.error("Store model not found");
    }

    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    })
      .populate({
        path: "storeId",
        select: "_id name slug",
        model: "Store",
      })
      .sort({ createdAt: -1 })
      .lean();

    return products
      .filter((p: any) => p.storeId)
      .map((p: any) => {
        const productImages = p.images || [];
        const storeId =
          typeof p.storeId === "string" ? p.storeId : p.storeId?._id?.toString() || "";
        const storeSlug =
          typeof p.storeId === "object" && p.storeId?.slug ? p.storeId.slug : "";

        return {
          id: p._id.toString(),
          name: p.name || "Unnamed Product",
          description: p.description || null,
          price: p.price || 0,
          compare_at_price: p.compareAtPrice || null,
          inventory_quantity: p.inventoryQuantity ?? 0,
          images: productImages.map((img: any) => ({
            id: img._id?.toString() || img.id || "",
            url: img.url || "",
            alt_text: img.altText || img.alt_text || null,
          })),
          store_id: storeId,
          store_slug: storeSlug,
          created_at: p.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: p.updatedAt?.toISOString() || new Date().toISOString(),
        };
      });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getHeroBanner() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/hero-banner`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return data.banner || null;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function ProductsPage() {
  const [products, banner] = await Promise.all([
    getProducts(),
    getHeroBanner(),
  ]);

  return (
    <AllStoreProductsClient
      initialProducts={products}
      initialBanner={banner}
    />
  );
}
