// app/stores/page.tsx
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import StoresPageClient from "./StoresPageClient";

// Rendered once, served from the CDN, refreshed in the background every minute
export const revalidate = 60;

const MAX_STORE_CARDS = 30;

async function getStoresData() {
  try {
    await connectToDB();

    const stores = await Store.find({
      isPublished: true,
      isApproved: true,
    })
      .select(
        "_id name slug description logo_url banner_url sellerId isPublished createdAt updatedAt businessHours",
      )
      .sort({ createdAt: -1 })
      .limit(MAX_STORE_CARDS)
      .maxTimeMS(5000)
      .lean();

    // The page only shows ONE number (total products), so a single count is
    // enough. The old version grouped per store and sent counts nobody used.
    const totalProducts = stores.length
      ? await Product.countDocuments({
          storeId: { $in: stores.map((s: any) => s._id) },
          isActive: true,
          isDeleted: false,
          inventoryQuantity: { $gt: 0 },
        })
      : 0;

    return {
      totalProducts,
      stores: stores.map((store: any) => ({
        _id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo_url: store.logo_url,
        banner_url: store.banner_url,
        sellerId: store.sellerId?.toString(),
        isPublished: store.isPublished,
        createdAt: store.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: store.updatedAt?.toISOString() || new Date().toISOString(),
        businessHours: store.businessHours || null,
      })),
    };
  } catch (error) {
    console.error("[Server] Error fetching stores:", error);
    return { totalProducts: 0, stores: [] };
  }
}

export default async function StoresPage() {
  const { stores, totalProducts } = await getStoresData();
  return <StoresPageClient initialStores={stores} totalProducts={totalProducts} />;
}