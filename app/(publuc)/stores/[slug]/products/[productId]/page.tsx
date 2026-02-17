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
    if (!store) {
      return null;
    }

    // Fetch product
    const product = await Product.findOne({
      _id: productId,
      storeId: store._id,
    }).lean();

    if (!product) {
      return null;
    }

    // Fetch related products
    const relatedProducts = await Product.find({
      storeId: store._id,
      _id: { $ne: productId },
    })
      .limit(4)
      .lean();

    // Transform data to match expected format
    const transformProduct = (p: any) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      compare_at_price: p.compareAtPrice,
      category_id: p.categoryId?.toString(),
      inventory_quantity: p.inventoryQuantity,
      images: p.images?.map((img: any) => ({
        id: img._id?.toString() || Math.random().toString(),
        url: img.url,
        alt_text: img.altText,
      })) || [],
      store_id: p.storeId.toString(),
      created_at: p.createdAt?.toISOString(),
      updated_at: p.updatedAt?.toISOString(),
      hasVariants: p.hasVariants,
      variants: p.variants,
    });

    return {
      product: transformProduct(product),
      store: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo_url: store.logo_url,
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