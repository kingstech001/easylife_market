import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import type { SearchProduct } from "@/lib/search-products";

const STORES_PER_BATCH = 4;
export type DiscoveryProduct = SearchProduct & { store_name: string; store_slug: string };
export type DiscoveryBatch = { products: DiscoveryProduct[]; hasMore: boolean };

// Nigeria's calendar day, independent of the server's timezone.
export function discoveryDay(now = Date.now()): string {
  return new Date(now + 60 * 60 * 1000).toISOString().slice(0, 10);
}

const toISO = (value: unknown) => value ? new Date(value as string).toISOString() : "";

async function fetchDiscoveryBatch(page: number, day: string): Promise<DiscoveryBatch> {
  await connectToDB();
  const stores = await Store.aggregate([
    { $match: { isPublished: true, isApproved: true, slug: { $type: "string", $ne: "" } } },
    // Seeded ranking rotates stores daily without changing order on every visit.
    { $set: { dailyRank: { $toHashedIndexKey: { $concat: [day, ":", { $toString: "$_id" }] } } } },
    { $sort: { dailyRank: 1, _id: 1 } },
    { $skip: (page - 1) * STORES_PER_BATCH },
    { $limit: STORES_PER_BATCH + 1 },
    { $project: { name: 1, slug: 1 } },
    {
      $lookup: {
        from: Product.collection.name,
        let: { sid: "$_id" },
        pipeline: [
          { $match: {
            $expr: { $eq: ["$storeId", "$$sid"] },
            isActive: true, isDeleted: false, inventoryQuantity: { $gt: 0 },
          } },
          { $set: { dailyRank: { $toHashedIndexKey: { $concat: [day, ":", { $toString: "$_id" }] } } } },
          { $sort: { dailyRank: 1, _id: 1 } },
          { $limit: 3 },
          { $project: {
            name: 1, price: 1, compareAtPrice: 1, inventoryQuantity: 1,
            images: { $slice: [{ $ifNull: ["$images", []] }, 1] },
            createdAt: 1, updatedAt: 1, hasVariants: 1, hasModifiers: 1,
          } },
        ],
        as: "picks",
      },
    },
  ]).option({ maxTimeMS: 8000 });

  const products: DiscoveryProduct[] = stores.slice(0, STORES_PER_BATCH).flatMap((store: any) =>
    store.picks.map((product: any) => ({
      id: String(product._id), name: product.name || "Untitled product", description: null,
      price: product.price || 0, compare_at_price: product.compareAtPrice ?? null,
      inventory_quantity: product.inventoryQuantity,
      images: (product.images || []).map((image: any) => ({
        id: String(image._id || ""), url: image.url || "", alt_text: image.altText || null,
      })),
      store_id: String(store._id), store_slug: store.slug, store_name: store.name || "Store",
      created_at: toISO(product.createdAt), updated_at: toISO(product.updatedAt),
      hasVariants: !!product.hasVariants, hasModifiers: !!product.hasModifiers,
    })),
  );

  // Mix the selected products across stores; this is stable for the selected day.
  const rank = (id: string) => createHash("sha256").update(`${day}:${id}`).digest("hex");
  products.sort((a, b) => rank(a.id).localeCompare(rank(b.id)));
  return { products, hasMore: stores.length > STORES_PER_BATCH };
}

// Short cache keeps availability reasonably fresh; the daily seed keeps picks stable.
// Errors propagate so temporary database failures are never cached as empty results.
export const getDiscoveryBatch = unstable_cache(fetchDiscoveryBatch, ["discovery-products-v1"], {
  revalidate: 120,
  tags: ["discovery-products"],
});
