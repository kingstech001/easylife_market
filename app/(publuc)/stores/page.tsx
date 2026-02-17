// app/stores/page.tsx
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import StoresPageClient from "./StoresPageClient";

async function getStoresData() {
  try {
    console.log("🔍 [Server] Fetching stores from database");
    
    await connectToDB();

    // Fetch all published and approved stores
    const stores = await Store.find({
      isPublished: true,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    console.log("✅ [Server] Stores found:", stores.length);

    // Count products for each store in parallel
    const storesWithProductCount = await Promise.all(
      stores.map(async (store: any) => {
        const productCount = await Product.countDocuments({
          storeId: store._id,
        });

        return {
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
          productCount,
        };
      })
    );

    return storesWithProductCount;
  } catch (error) {
    console.error("❌ [Server] Error fetching stores:", error);
    return [];
  }
}

export default async function StoresPage() {
  const stores = await getStoresData();

  return <StoresPageClient initialStores={stores} />;
}