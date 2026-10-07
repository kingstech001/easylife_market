// app/stores/[slug]/products/[productId]/page.tsx
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import ProductPageClient from "./ProductPageClient";

// Cached at the CDN and refreshed every minute. Without this, a dynamic route with
// no revalidate setting can be cached indefinitely, so price and stock changes
// would never show up.
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

// Full product (variants + modifiers), serialised for the client
function transformProduct(p: any) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    category_id: p.category || p.categoryId?.toString() || null,
    inventory_quantity: p.inventoryQuantity,
    images:
      p.images?.map((img: any, i: number) => ({
        id: img._id?.toString() || String(i),
        url: img.url,
        alt_text: img.altText ?? null,
      })) || [],
    store_id: p.storeId.toString(),
    created_at: p.createdAt?.toISOString() ?? null,
    updated_at: p.updatedAt?.toISOString() ?? null,

    // Retail variants: serialise each ObjectId
    hasVariants: p.hasVariants ?? false,
    variants: (p.variants ?? []).map((v: any) => ({
      _id: v._id?.toString(),
      color: {
        _id: v.color?._id?.toString(),
        name: v.color?.name,
        hex: v.color?.hex,
      },
      sizes: (v.sizes ?? []).map((s: any) => ({
        _id: s._id?.toString(),
        size: s.size,
        quantity: s.quantity,
      })),
      priceAdjustment: v.priceAdjustment ?? 0,
    })),

    // Food modifier groups: serialise every nested ObjectId
    hasModifiers: p.hasModifiers ?? false,
    modifierGroups: (p.modifierGroups ?? []).map((g: any) => ({
      _id: g._id?.toString(),
      name: g.name,
      required: g.required ?? false,
      selectionType: g.selectionType,
      minSelection: g.minSelection ?? 0,
      maxSelection: g.maxSelection ?? 1,
      options: (g.options ?? []).map((o: any) => ({
        _id: o._id?.toString(),
        name: o.name,
        priceAdjustment: o.priceAdjustment ?? 0,
        inventoryQuantity: o.inventoryQuantity ?? undefined,
        isActive: o.isActive ?? true,
      })),
    })),
  };
}

// "More from this store" cards only need the basics, so no variants/modifier payload
function transformRelated(p: any) {
  return {
    id: p._id.toString(),
    name: p.name,
    description: null,
    price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    inventory_quantity: p.inventoryQuantity,
    images: (p.images ?? []).slice(0, 1).map((img: any, i: number) => ({
      id: img._id?.toString() || String(i),
      url: img.url,
      alt_text: img.altText ?? null,
    })),
    store_id: p.storeId.toString(),
    created_at: p.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: p.updatedAt?.toISOString() ?? new Date().toISOString(),
    hasVariants: !!p.hasVariants,
    hasModifiers: !!p.hasModifiers,
  };
}

// React cache(): generateMetadata and the page share one set of queries
const getProductData = cache(async (slug: string, productId: string) => {
  try {
    if (!isValidObjectId(productId)) return null;

    await connectToDB();

    const store = await Store.findOne({ slug, isPublished: true })
      .select("name slug description logo_url categories")
      .lean();
    if (!store) return null;

    // The product and the related list don't depend on each other
    const [product, relatedProducts] = await Promise.all([
      Product.findOne({
        _id: productId,
        storeId: store._id,
        isActive: true,
        isDeleted: false,
        inventoryQuantity: { $gt: 0 },
      }).lean(),
      Product.find({
        storeId: store._id,
        _id: { $ne: productId },
        isActive: true,
        isDeleted: false,
        inventoryQuantity: { $gt: 0 },
      })
        .select(
          "name price compareAtPrice inventoryQuantity images hasVariants hasModifiers storeId createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    if (!product) return null;

    return {
      product: transformProduct(product),
      store: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo_url: store.logo_url,
        // The client uses categories to detect restaurant stores
        categories: store.categories || [],
      },
      relatedProducts: relatedProducts.map(transformRelated),
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return null;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const data = await getProductData(slug, productId);

  if (!data) {
    return { title: "Product not found | EasyLife Market" };
  }

  const { product, store } = data;
  const description =
    (product.description || "").slice(0, 160) ||
    `Buy ${product.name} from ${store.name} on EasyLife Market`;
  const image = product.images[0]?.url;

  return {
    title: `${product.name} | ${store.name}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productId } = await params;

  const data = await getProductData(slug, productId);

  if (!data) {
    notFound();
  }

  return (
    <ProductPageClient
      initialProduct={data.product}
      initialStore={data.store}
      initialRelatedProducts={data.relatedProducts}
    />
  );
}