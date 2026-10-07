// lib/search-products.ts
// Server-only: runs the search/category filtering inside MongoDB instead of
// downloading products to the browser and filtering them there.

import { unstable_cache } from "next/cache";
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";

export const SEARCH_PAGE_SIZE = 24;

export type SearchProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
};

type SearchArgs = {
  q: string;
  categories: string[];
  page: number;
  limit?: number;
};

export type SearchResult = { products: SearchProduct[]; hasMore: boolean };

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const contains = (s: string) => ({ $regex: escapeRegex(s), $options: "i" });
const toISO = (d: unknown) =>
  d ? new Date(d as string | number | Date).toISOString() : new Date().toISOString();

async function runSearch({
  q,
  categories,
  page,
  limit = SEARCH_PAGE_SIZE,
}: SearchArgs): Promise<SearchResult> {
  await connectToDB();

  const term = q.trim();
  // The category URLs already contain the category AND all its subcategories
  // (see buildCategorySearchUrl), so no further expansion is needed here.
  const catTerms = Array.from(
    new Set(categories.map((c) => c.trim().toLowerCase()).filter(Boolean)),
  );

  const match: Record<string, any> = {
    isActive: true,
    isDeleted: false,
    inventoryQuantity: { $gt: 0 },
  };

  const and: Record<string, any>[] = [];
  if (term) {
    and.push({
      $or: [
        { name: contains(term) },
        { description: contains(term) },
        { category: contains(term) },
      ],
    });
  }
  if (catTerms.length > 0) {
    and.push({
      $or: catTerms.flatMap((t) => [
        { name: contains(t) },
        { description: contains(t) },
        { category: contains(t) },
      ]),
    });
  }
  if (and.length > 0) match.$and = and;

  const rows = await Product.aggregate([
    { $match: match },
    { $sort: { createdAt: -1, _id: -1 } }, // _id tiebreaker keeps pagination stable
    {
      // Only products from approved + published stores
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
    { $unwind: "$store" },
    { $skip: (Math.max(1, page) - 1) * limit },
    { $limit: limit + 1 }, // one extra row tells us whether another page exists
    {
      $project: {
        name: 1,
        description: 1,
        price: 1,
        compareAtPrice: 1,
        category: 1,
        inventoryQuantity: 1,
        images: { $slice: ["$images", 1] }, // cards only show the first image
        storeId: 1,
        "store.slug": 1,
        createdAt: 1,
        updatedAt: 1,
        hasVariants: 1,
        hasModifiers: 1,
      },
    },
  ]).option({ maxTimeMS: 8000 });

  const hasMore = rows.length > limit;

  const products: SearchProduct[] = rows.slice(0, limit).map((p: any) => ({
    id: p._id.toString(),
    name: p.name,
    description: p.description || null,
    price: p.price,
    compare_at_price: p.compareAtPrice || null,
    category: p.category,
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

  return { products, hasMore };
}

// Browse and category views (no typed text) are the same for everyone, so cache
// them for a minute. Free-text searches run live: caching every possible typed
// query would just fill the cache with one-off entries.
const runSearchCached = unstable_cache(runSearch, ["search-products"], {
  revalidate: 60,
  tags: ["search-products"],
});

export function searchProducts(args: SearchArgs): Promise<SearchResult> {
  return args.q.trim() ? runSearch(args) : runSearchCached(args);
}