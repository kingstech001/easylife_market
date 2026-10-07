// components/NewProductsSection.tsx (Server Component)

import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { NewProductsLoading } from "./NewProductsLoading";
import { NewProductsClient } from "./NewProductsClient";

// Only what the card needs. Variants are not sent: the card only checks the
// `hasVariants` / `hasModifiers` flags, and variants can be a big chunk of the payload.
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
  hasModifiers?: boolean;
};

const PRODUCT_LIMIT = 10;

const toISO = (d: unknown) =>
  d ? new Date(d as string | number | Date).toISOString() : new Date().toISOString();

// One round trip: newest in-stock products whose store is approved + published.
// (The old version fetched 10, populated stores in a second query, THEN filtered,
// so it could return fewer than 10 whenever a new product belonged to a hidden store.)
//
// Cached for 2 minutes so most visitors never hit MongoDB. It throws on failure on
// purpose: unstable_cache doesn't cache errors, so a failed query can't get stuck
// as "No New Products Yet".
const fetchNewProducts = unstable_cache(
  async (): Promise<ProductData[]> => {
    await connectToDB();

    const products = await Product.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: false,
          inventoryQuantity: { $gt: 0 },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: Store.collection.name,
          let: { sid: "$storeId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$sid"] },
                isApproved: true,
                isPublished: true,
              },
            },
            { $project: { slug: 1 } },
          ],
          as: "store",
        },
      },
      { $unwind: "$store" }, // drops products whose store is not approved/published
      { $limit: PRODUCT_LIMIT },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          compareAtPrice: 1,
          inventoryQuantity: 1,
          images: { $slice: ["$images", 1] }, // the card only shows the first image
          storeId: 1,
          "store.slug": 1,
          createdAt: 1,
          updatedAt: 1,
          hasVariants: 1,
          hasModifiers: 1,
        },
      },
    ]).option({ maxTimeMS: 5000 });

    return products.map((p: any) => ({
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
      store_id: p.storeId.toString(),
      store_slug: p.store?.slug,
      created_at: toISO(p.createdAt),
      updated_at: toISO(p.updatedAt),
      hasVariants: !!p.hasVariants,
      hasModifiers: !!p.hasModifiers,
    }));
  },
  ["new-products"],
  { revalidate: 120, tags: ["new-products"] },
);

async function getNewProducts(): Promise<ProductData[]> {
  try {
    return await fetchNewProducts();
  } catch (error) {
    console.error("Error fetching new products:", error);
    return [];
  }
}

// The data fetch lives in this inner component so <Suspense> can actually stream:
// the skeleton shows immediately and the rest of the page isn't held up.
// (Before, the outer component awaited the query itself, so the fallback never showed
// and the whole home page waited on this query.)
async function NewProductsContent() {
  const products = await getNewProducts();
  return <NewProductsClient products={products} />;
}

export default function NewProductsSection() {
  return (
    <Suspense fallback={<NewProductsLoading />}>
      <NewProductsContent />
    </Suspense>
  );
}