// app/stores/page.tsx
import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import StoresPageClient from "./StoresPageClient";

export const revalidate = 60;

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
      .lean();

    const storeIds = stores.map((store: any) => store._id);
    const productCounts = await Product.aggregate([
      {
        $match: {
          storeId: { $in: storeIds },
          isActive: true,
          isDeleted: false,
        },
      },
      { $group: { _id: "$storeId", count: { $sum: 1 } } },
    ]);
    const countByStoreId = new Map(
      productCounts.map((item: { _id: any; count: number }) => [
        item._id.toString(),
        item.count,
      ]),
    );

    return stores.map((store: any) => ({
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
      productCount: countByStoreId.get(store._id.toString()) || 0,
      businessHours: store.businessHours || null,
    }));
  } catch (error) {
    console.error("[Server] Error fetching stores:", error);
    return [];
  }
}

export default async function StoresPage() {
  const stores = await getStoresData();
  return <StoresPageClient initialStores={stores} />;
}
