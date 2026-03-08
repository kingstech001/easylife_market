// app/stores/[slug]/products/[productId]/page.tsx
import { notFound } from "next/navigation";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import ProductPageClient from "./ProductPageClient";

interface PageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

async function getProductData(slug: string, productId: string) {
  try {
    await connectToDB();

    // Fetch store
    const store = await Store.findOne({ slug, isPublished: true }).lean();
    if (!store) return null;

    // Fetch product
    const product = await Product.findOne({
      _id: productId,
      storeId: store._id,
    }).lean();
    if (!product) return null;

    // Fetch related products
    const relatedProducts = await Product.find({
      storeId: store._id,
      _id: { $ne: productId },
    })
      .limit(4)
      .lean();

    const transformProduct = (p: any) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description ?? null,
      price: p.price,
      compare_at_price: p.compareAtPrice ?? null,
      category_id: p.category || p.categoryId?.toString() || null,
      inventory_quantity: p.inventoryQuantity,
      images:
        p.images?.map((img: any) => ({
          id: img._id?.toString() || Math.random().toString(),
          url: img.url,
          alt_text: img.altText ?? null,
        })) || [],
      store_id: p.storeId.toString(),
      created_at: p.createdAt?.toISOString() ?? null,
      updated_at: p.updatedAt?.toISOString() ?? null,

      // ── Retail variants — serialize each ObjectId ──────────────────────
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

      // ── Food modifier groups — serialize every nested ObjectId ─────────
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
    });

    return {
      product: transformProduct(product),
      store: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo_url: store.logo_url,
        // ✅ Pass categories so the client can detect restaurant stores
        categories: store.categories || [],
      },
      relatedProducts: relatedProducts.map(transformProduct),
    };
  } catch (error) {
    console.error("Error fetching product data:", error);
    return null;
  }
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